/**
 * Migration: Add Missing Indexes for Query Optimization
 * 
 * Run with: npx tsx scripts/add-missing-indexes.ts
 * 
 * These indexes optimize:
 * 1. Soft-delete queries (userId + deletedAt)
 * 2. Active record queries (userId + isActive)
 * 3. Recurring transactions forecast queries (userId, isActive, nextDueDate)
 * 4. Account balance queries (userId, includeInTotal, isActive)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!;
const sql = postgres(connectionUrl, { max: 1 });

async function run() {
  console.log("📊 Creating missing indexes...\n");

  const indexes = [
    // Soft-delete optimization indexes
    {
      name: "transactions_user_deleted_idx",
      sql: `CREATE INDEX IF NOT EXISTS transactions_user_deleted_idx ON transactions(user_id, deleted_at) WHERE deleted_at IS NOT NULL`,
      description: "Optimizes soft-delete queries on transactions",
    },
    {
      name: "accounts_user_deleted_idx",
      sql: `CREATE INDEX IF NOT EXISTS accounts_user_deleted_idx ON accounts(user_id, deleted_at) WHERE deleted_at IS NOT NULL`,
      description: "Optimizes soft-delete queries on accounts",
    },
    {
      name: "goals_user_deleted_idx",
      sql: `CREATE INDEX IF NOT EXISTS goals_user_deleted_idx ON goals(user_id, deleted_at) WHERE deleted_at IS NOT NULL`,
      description: "Optimizes soft-delete queries on goals",
    },
    {
      name: "credit_cards_user_deleted_idx",
      sql: `CREATE INDEX IF NOT EXISTS credit_cards_user_deleted_idx ON credit_cards(user_id, deleted_at) WHERE deleted_at IS NOT NULL`,
      description: "Optimizes soft-delete queries on credit_cards",
    },
    {
      name: "card_transactions_user_deleted_idx",
      sql: `CREATE INDEX IF NOT EXISTS card_transactions_user_deleted_idx ON card_transactions(user_id, deleted_at) WHERE deleted_at IS NOT NULL`,
      description: "Optimizes soft-delete queries on card_transactions",
    },

    // Active record optimization indexes
    {
      name: "recurring_transactions_user_active_idx",
      sql: `CREATE INDEX IF NOT EXISTS recurring_transactions_user_active_idx ON recurring_transactions(user_id, is_active)`,
      description: "Optimizes filtering active recurring transactions",
    },
    {
      name: "recurring_transactions_user_active_next_idx",
      sql: `CREATE INDEX IF NOT EXISTS recurring_transactions_user_active_next_idx ON recurring_transactions(user_id, is_active, next_due_date)`,
      description: "Optimizes forecast route recurring transactions query",
    },

    // Account balance query optimization
    {
      name: "accounts_user_include_active_idx",
      sql: `CREATE INDEX IF NOT EXISTS accounts_user_include_active_idx ON accounts(user_id, include_in_total, is_active)`,
      description: "Optimizes account balance aggregation",
    },

    // Composite index for card transactions reports (already exists for forecast, adding for completeness)
    {
      name: "card_transactions_user_invoice_idx",
      sql: `CREATE INDEX IF NOT EXISTS card_transactions_user_invoice_idx ON card_transactions(user_id, invoice_month, invoice_year)`,
      description: "Optimizes card transactions by user and invoice period",
    },
  ];

  for (const idx of indexes) {
    try {
      console.log(`Creating: ${idx.name}`);
      console.log(`  ${idx.description}`);
      await sql.unsafe(idx.sql);
      console.log(`  ✅ Created\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${error}\n`);
    }
  }

  console.log("✅ Index creation complete.");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
