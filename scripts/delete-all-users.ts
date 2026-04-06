import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function deleteAllUsers() {
  console.log("Apagando todos os usuários...\n");

  // Primeiro apagar dados relacionados (transações, contas, etc.)
  await client`DELETE FROM card_transactions`;
  console.log("✓ Transações de cartão apagadas");

  await client`DELETE FROM credit_cards`;
  console.log("✓ Cartões de crédito apagados");

  await client`DELETE FROM goals`;
  console.log("✓ Metas apagadas");

  await client`DELETE FROM budgets`;
  console.log("✓ Orçamentos apagados");

  await client`DELETE FROM recurring_transactions`;
  console.log("✓ Transações recorrentes apagadas");

  await client`DELETE FROM transactions`;
  console.log("✓ Transações apagadas");

  await client`DELETE FROM categories`;
  console.log("✓ Categorias apagadas");

  await client`DELETE FROM accounts`;
  console.log("✓ Contas apagadas");

  await client`DELETE FROM verification_tokens`;
  console.log("✓ Tokens de verificação apagados");

  await client`DELETE FROM sessions`;
  console.log("✓ Sessões apagadas");

  await client`DELETE FROM auth_accounts`;
  console.log("✓ Contas de autenticação apagadas");

  // Por fim, apagar usuários
  const result = await client`DELETE FROM users RETURNING *`;
  console.log(`\n✓ ${result.length} usuários apagados`);

  result.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.name} (${user.email})`);
  });

  await client.end();
  console.log("\n✅ Todos os dados foram apagados com sucesso!");
}

deleteAllUsers().catch(console.error);