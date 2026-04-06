import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Usuários
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  locale: varchar('locale', { length: 5 }).default('pt-BR'),
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  emailVerified: timestamp('email_verified'),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contas Bancárias
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'checking', 'savings', 'credit_card', 'investment'
  bank: varchar('bank', { length: 100 }),
  agency: varchar('agency', { length: 20 }),
  number: varchar('number', { length: 50 }),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  color: varchar('color', { length: 7 }).default('#000000'),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').default(true),
  includeInTotal: boolean('include_in_total').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categorias
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'income', 'expense'
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }).default('#000000'),
  parentId: uuid('parent_id').references((): any => categories.id),
  budgetAmount: decimal('budget_amount', { precision: 15, scale: 2 }),
  budgetPeriod: varchar('budget_period', { length: 10 }), // 'weekly', 'monthly', 'yearly'
  tags: jsonb('tags').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transações
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'income', 'expense', 'transfer'
  date: date('date').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  notes: text('notes'),
  subtype: varchar('subtype', { length: 20 }).default('single'),
  recurringId: uuid('recurring_id'),
  recurringGroupId: uuid('recurring_group_id'),
  totalOccurrences: integer('total_occurrences'),
  currentOccurrence: integer('current_occurrence'),
  isPaid: boolean('is_paid').default(true),
  attachments: jsonb('attachments'), // URLs de anexos
  tags: jsonb('tags').$type<string[]>(), // Lista de tags
  dueDate: date('due_date'),
  receiveDate: date('receive_date'),
  location: varchar('location', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orçamentos
export const budgets = pgTable('budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  period: varchar('period', { length: 10 }).notNull(), // 'weekly', 'monthly', 'yearly'
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  alertsEnabled: boolean('alerts_enabled').default(true),
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('80'), // 80%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Metas Financeiras
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0'),
  deadline: date('deadline'),
  categoryId: uuid('category_id').references(() => categories.id),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'cancelled'
  priority: varchar('priority', { length: 10 }).default('medium'), // 'low', 'medium', 'high'
  notes: text('notes'),
  monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transações Recorrentes
export const recurringTransactions = pgTable('recurring_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  interval: integer('interval').default(1), // A cada X dias/semanas/meses
  nextDueDate: date('next_due_date').notNull(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessões (NextAuth)
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Contas de Autenticação (NextAuth)
export const authAccounts = pgTable('auth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
});

// Tokens de Verificação (NextAuth)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Relacionamentos
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  categories: many(categories),
  budgets: many(budgets),
  goals: many(goals),
  recurringTransactions: many(recurringTransactions),
  sessions: many(sessions),
  authAccounts: many(authAccounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
  goals: many(goals),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

// Cartões de Crédito
export const creditCards = pgTable('credit_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  bank: varchar('bank', { length: 100 }).notNull(),
  lastDigits: varchar('last_digits', { length: 4 }),
  limit: decimal('limit', { precision: 15, scale: 2 }).notNull(),
  usedAmount: decimal('used_amount', { precision: 15, scale: 2 }).default('0'),
  dueDay: integer('due_day').notNull(),
  closingDay: integer('closing_day').notNull(),
  color: varchar('color', { length: 7 }).default('#820AD1'),
  gradient: varchar('gradient', { length: 100 }).default('from-[#820AD1] to-[#4B0082]'),
  network: varchar('network', { length: 20 }).default('mastercard'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lançamentos de Cartão
export const cardTransactions = pgTable('card_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => creditCards.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  date: date('date').notNull(),
  invoiceMonth: integer('invoice_month').notNull(),
  invoiceYear: integer('invoice_year').notNull(),
  launchType: varchar('launch_type', { length: 20 }).notNull(),
  totalInstallments: integer('total_installments'),
  currentInstallment: integer('current_installment'),
  groupId: uuid('group_id'),
  tags: jsonb('tags').$type<string[]>(),
  isPending: boolean('is_pending').default(false),
  isFixed: boolean('is_fixed').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  user: one(users, { fields: [creditCards.userId], references: [users.id] }),
  transactions: many(cardTransactions),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(creditCards, { fields: [cardTransactions.cardId], references: [creditCards.id] }),
  user: one(users, { fields: [cardTransactions.userId], references: [users.id] }),
  category: one(categories, { fields: [cardTransactions.categoryId], references: [categories.id] }),
}));

