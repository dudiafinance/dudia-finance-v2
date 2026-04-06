import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function migrate() {
  console.log("Adding supabase_id column to users table...");

  await client`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE
  `;

  console.log("Migration complete!");
  await client.end();
}

migrate().catch(console.error);