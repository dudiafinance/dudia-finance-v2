/**
 * Idempotent database setup script.
 * Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it's safe to run on every
 * deploy against an existing or brand-new database.
 */

import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

// Load .env.local for local development (no-op in production where env vars are injected)
config({ path: resolve(process.cwd(), ".env.local") });

// Prefer direct (non-pooled) connection for DDL statements
const connectionUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!;
const sql = postgres(connectionUrl, { max: 1 });

async function run() {
  console.log("🔧 Running database setup...");

  // ── Users ───────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      email           varchar(255) NOT NULL,
      password_hash   varchar(255) NOT NULL,
      name            varchar(255) NOT NULL,
      avatar          text,
      currency        varchar(3)  DEFAULT 'BRL',
      locale          varchar(5)  DEFAULT 'pt-BR',
      timezone        varchar(50) DEFAULT 'America/Sao_Paulo',
      email_verified  timestamp,
      created_at      timestamp DEFAULT now() NOT NULL,
      updated_at      timestamp DEFAULT now() NOT NULL,
      CONSTRAINT users_email_unique UNIQUE(email)
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`;

  // ── Auth / Sessions ─────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS auth_accounts (
      id                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id             uuid NOT NULL REFERENCES users(id),
      type                varchar(255) NOT NULL,
      provider            varchar(255) NOT NULL,
      provider_account_id varchar(255) NOT NULL,
      refresh_token       text,
      access_token        text,
      expires_at          integer,
      token_type          varchar(255),
      scope               text,
      id_token            text,
      session_state       varchar(255)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id        uuid NOT NULL REFERENCES users(id),
      session_token  varchar(255) NOT NULL,
      expires        timestamp NOT NULL,
      CONSTRAINT sessions_session_token_unique UNIQUE(session_token)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier  varchar(255) NOT NULL,
      token       varchar(255) NOT NULL,
      expires     timestamp NOT NULL,
      CONSTRAINT verification_tokens_token_unique UNIQUE(token)
    )
  `;

  // ── Accounts ────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id          uuid NOT NULL REFERENCES users(id),
      name             varchar(255) NOT NULL,
      type             varchar(20)  NOT NULL,
      bank             varchar(100),
      agency           varchar(20),
      number           varchar(50),
      balance          numeric(15,2) DEFAULT '0',
      currency         varchar(3)   DEFAULT 'BRL',
      color            varchar(7)   DEFAULT '#000000',
      icon             varchar(50),
      is_active        boolean DEFAULT true,
      include_in_total boolean DEFAULT true,
      created_at       timestamp DEFAULT now() NOT NULL,
      updated_at       timestamp DEFAULT now() NOT NULL
    )
  `;

  // ── Categories ──────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id        uuid NOT NULL REFERENCES users(id),
      name           varchar(100) NOT NULL,
      type           varchar(10)  NOT NULL,
      icon           varchar(50),
      color          varchar(7)   DEFAULT '#000000',
      parent_id      uuid REFERENCES categories(id),
      budget_amount  numeric(15,2),
      budget_period  varchar(10),
      is_active      boolean DEFAULT true,
      "order"        integer DEFAULT 0,
      created_at     timestamp DEFAULT now() NOT NULL,
      updated_at     timestamp DEFAULT now() NOT NULL
    )
  `;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS tags jsonb`;

  // ── Transactions ────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id      uuid NOT NULL REFERENCES users(id),
      account_id   uuid NOT NULL REFERENCES accounts(id),
      category_id  uuid REFERENCES categories(id),
      amount       numeric(15,2) NOT NULL,
      type         varchar(10)  NOT NULL,
      date         date         NOT NULL,
      description  varchar(255) NOT NULL,
      notes        text,
      is_paid      boolean DEFAULT true,
      attachments  jsonb,
      tags         jsonb,
      location     varchar(255),
      created_at   timestamp DEFAULT now() NOT NULL,
      updated_at   timestamp DEFAULT now() NOT NULL
    )
  `;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtype             varchar(20) DEFAULT 'single'`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id        uuid`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_group_id  uuid`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_occurrences   integer`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS current_occurrence  integer`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_date            date`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receive_date        date`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS is_recurring`;

  // ── Budgets ─────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS budgets (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id         uuid NOT NULL REFERENCES users(id),
      category_id     uuid REFERENCES categories(id),
      name            varchar(255) NOT NULL,
      amount          numeric(15,2) NOT NULL,
      period          varchar(10)  NOT NULL,
      start_date      date         NOT NULL,
      end_date        date,
      is_active       boolean DEFAULT true,
      alerts_enabled  boolean DEFAULT true,
      alert_threshold numeric(5,2) DEFAULT '80',
      created_at      timestamp DEFAULT now() NOT NULL,
      updated_at      timestamp DEFAULT now() NOT NULL
    )
  `;

  // ── Goals ───────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id                   uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id              uuid NOT NULL REFERENCES users(id),
      account_id           uuid REFERENCES accounts(id),
      name                 varchar(255) NOT NULL,
      target_amount        numeric(15,2) NOT NULL,
      current_amount       numeric(15,2) DEFAULT '0',
      deadline             date,
      category_id          uuid REFERENCES categories(id),
      status               varchar(20) DEFAULT 'active',
      priority             varchar(10) DEFAULT 'medium',
      notes                text,
      monthly_contribution numeric(15,2),
      created_at           timestamp DEFAULT now() NOT NULL,
      updated_at           timestamp DEFAULT now() NOT NULL
    )
  `;

  // ── Recurring Transactions ──────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id       uuid NOT NULL REFERENCES users(id),
      account_id    uuid NOT NULL REFERENCES accounts(id),
      category_id   uuid REFERENCES categories(id),
      amount        numeric(15,2) NOT NULL,
      type          varchar(10)  NOT NULL,
      description   varchar(255) NOT NULL,
      frequency     varchar(20)  NOT NULL,
      interval      integer DEFAULT 1,
      next_due_date date         NOT NULL,
      end_date      date,
      is_active     boolean DEFAULT true,
      created_at    timestamp DEFAULT now() NOT NULL,
      updated_at    timestamp DEFAULT now() NOT NULL
    )
  `;

  // ── Credit Cards ────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id      uuid NOT NULL REFERENCES users(id),
      name         varchar(255) NOT NULL,
      bank         varchar(100) NOT NULL,
      last_digits  varchar(4),
      "limit"      numeric(15,2) NOT NULL,
      used_amount  numeric(15,2) DEFAULT '0',
      due_day      integer NOT NULL,
      closing_day  integer NOT NULL,
      color        varchar(7)   DEFAULT '#820AD1',
      gradient     varchar(100) DEFAULT 'from-[#820AD1] to-[#4B0082]',
      network      varchar(20)  DEFAULT 'mastercard',
      is_active    boolean DEFAULT true,
      created_at   timestamp DEFAULT now() NOT NULL,
      updated_at   timestamp DEFAULT now() NOT NULL
    )
  `;

  // ── Card Transactions ───────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS card_transactions (
      id                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      card_id             uuid NOT NULL REFERENCES credit_cards(id),
      user_id             uuid NOT NULL REFERENCES users(id),
      category_id         uuid REFERENCES categories(id),
      description         varchar(255) NOT NULL,
      amount              numeric(15,2) NOT NULL,
      total_amount        numeric(15,2) NOT NULL,
      date                date         NOT NULL,
      invoice_month       integer NOT NULL,
      invoice_year        integer NOT NULL,
      launch_type         varchar(20)  NOT NULL,
      total_installments  integer,
      current_installment integer,
      group_id            uuid,
      tags                jsonb,
      is_pending          boolean DEFAULT false,
      is_fixed            boolean DEFAULT false,
      notes               text,
      created_at          timestamp DEFAULT now() NOT NULL,
      updated_at          timestamp DEFAULT now() NOT NULL
    )
  `;

  console.log("✅ Database setup complete.");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Database setup failed:", err);
  process.exit(1);
});
