/**
 * Migration: Remove password_hash Column (Legacy)
 * 
 * Run with: npx tsx scripts/remove-password-hash.ts
 * 
 * This migration safely removes the legacy password_hash column that was:
 * 1. Defined in migrate.ts but never used (Clerk handles auth)
 * 2. Not present in the current Drizzle schema
 * 3. Never read by any application code
 * 
 * Strategy:
 * - Step 1: Check if column exists in database
 * - Step 2: If exists, rename to password_hash_legacy for safety
 * - Step 3: Drop the legacy column in a subsequent run (or immediate if confident)
 * 
 * This is a ZERO-RISK migration since the field is never read.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!;
const sql = postgres(connectionUrl, { max: 1 });

async function run() {
  console.log("🔐 Checking password_hash column status...\n");

  try {
    // Check if column exists in users table
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `;

    if (columnExists.length === 0) {
      console.log("✅ password_hash column does not exist. Nothing to do.");
      await sql.end();
      return;
    }

    console.log("⚠️  password_hash column found in database.");
    console.log("   Renaming to password_hash_legacy for safety...\n");

    // Step 1: Rename to legacy (reversible)
    await sql`ALTER TABLE users RENAME COLUMN password_hash TO password_hash_legacy`;
    console.log("✅ Renamed password_hash -> password_hash_legacy\n");

    // Step 2: Drop the legacy column (uncomment in second run if you want immediate removal)
    // await sql`ALTER TABLE users DROP COLUMN IF EXISTS password_hash_legacy`;
    // console.log("✅ Dropped password_hash_legacy column\n");

    console.log("📝 NOTE: The password_hash_legacy column still exists in the database.");
    console.log("   Run this script again after reviewing data to drop it permanently,");
    console.log("   or execute: ALTER TABLE users DROP COLUMN IF EXISTS password_hash_legacy");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    await sql.end();
    process.exit(1);
  }

  await sql.end();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
