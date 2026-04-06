import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function listUsers() {
  const users = await client`
    SELECT id, name, email, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;

  console.log("\n=== USUÁRIOS CADASTRADOS ===\n");
  console.log(`Total: ${users.length} usuários\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Criado: ${user.created_at}`);
    console.log("");
  });

  await client.end();
}

listUsers().catch(console.error);