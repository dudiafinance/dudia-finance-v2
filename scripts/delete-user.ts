import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, integer, date, jsonb } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  locale: varchar('locale', { length: 5 }).default('pt-BR'),
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function deleteUser() {
  const email = "igorpminacio1@gmail.com";
  
  console.log(`Buscando usuário com email: ${email}`);
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    console.log("Usuário não encontrado.");
    await client.end();
    return;
  }

  const user = result[0];
  console.log(`Usuário encontrado: ID ${user.id}, Nome: ${user.name}`);

  await db.delete(users).where(eq(users.email, email));
  
  console.log("Usuário deletado com sucesso!");
  await client.end();
}

deleteUser().catch(console.error);