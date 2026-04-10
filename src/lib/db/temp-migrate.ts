import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding clerk_id column to users table...");
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_id" text UNIQUE;`);
    console.log("Success: clerk_id column added.");
  } catch (error) {
    console.error("Error adding column:", error);
  }
  process.exit(0);
}

main();
