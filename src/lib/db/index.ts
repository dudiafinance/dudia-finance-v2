import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente se não estiverem presentes (útil para testes/scripts)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config(); // Fallback para .env padrão
}

const connectionString = process.env.DATABASE_URL!;

// Conexão para queries
const client = postgres(connectionString);

export const db = drizzle(client, { schema });

// Tipos exportados
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Account = typeof schema.accounts.$inferSelect;
export type NewAccount = typeof schema.accounts.$inferInsert;

export type Category = typeof schema.categories.$inferSelect;
export type NewCategory = typeof schema.categories.$inferInsert;

export type Transaction = typeof schema.transactions.$inferSelect;
export type NewTransaction = typeof schema.transactions.$inferInsert;

export type Budget = typeof schema.budgets.$inferSelect;
export type NewBudget = typeof schema.budgets.$inferInsert;

export type Goal = typeof schema.goals.$inferSelect;
export type NewGoal = typeof schema.goals.$inferInsert;

export type GoalContribution = typeof schema.goalContributions.$inferSelect;
export type NewGoalContribution = typeof schema.goalContributions.$inferInsert;

export type RecurringTransaction = typeof schema.recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof schema.recurringTransactions.$inferInsert;