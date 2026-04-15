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
  index,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { encrypt, decrypt } from '../../crypto';

// Custom Type para campos criptografados
const encryptedText = customType<{ data: string }>({
  dataType() {
    return 'text';
  },
  toDriver(value: string) {
    return encrypt(value);
  },
  fromDriver(value: unknown) {
    if (typeof value !== 'string') return '';
    return decrypt(value);
  },
});

// Usuários
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  locale: varchar('locale', { length: 5 }).default('pt-BR'),
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  emailVerified: timestamp('email_verified'),
  tags: jsonb('tags').$type<string[]>().default([]),
  notificationPreferences: jsonb('notification_preferences').$type<{
    budgetAlerts?: boolean;
    recurringReminders?: boolean;
    monthlyReports?: boolean;
    promotions?: boolean;
  }>().default({
    budgetAlerts: true,
    recurringReminders: true,
    monthlyReports: true,
    promotions: true
  }),
  openRouterApiKey: encryptedText('open_router_api_key'),
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
  deletedAt: timestamp('deleted_at'), // Soft-delete
}, (table) => [
  index('accounts_user_id_idx').on(table.userId),
]);

// Categorias
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'income', 'expense'
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }).default('#000000'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: uuid('parent_id').references((): any => categories.id),
  budgetAmount: decimal('budget_amount', { precision: 15, scale: 2 }),
  budgetPeriod: varchar('budget_period', { length: 10 }), // 'weekly', 'monthly', 'yearly'
  tags: jsonb('tags').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('categories_user_parent_idx').on(table.userId, table.parentId),
]);

// Tags Globais
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#820AD1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tags_user_name_idx').on(table.userId, table.name),
]);

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
  linkedTransactionId: uuid('linked_transaction_id'), // Para transferências e estornos
  goalId: uuid('goal_id').references(() => goals.id), // Para depósitos de metas
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete
}, (table) => [
  index('transactions_user_id_idx').on(table.userId),
  index('transactions_date_idx').on(table.date),
  index('transactions_user_id_date_idx').on(table.userId, table.date), // Otimização para filtros
  index('transactions_account_ispaid_idx').on(table.accountId, table.isPaid), // Otimização para recálculo atômico de saldo
  index('transactions_account_date_idx').on(table.accountId, table.date), // Otimização para extrato de conta
  index('transactions_account_id_idx').on(table.accountId),
  index('transactions_category_id_idx').on(table.categoryId),
  index('transactions_user_cat_date_idx').on(table.userId, table.categoryId, table.date), // Otimização para orçamentos
  index('transactions_linked_tx_idx').on(table.linkedTransactionId),
  index('transactions_recurring_group_idx').on(table.recurringGroupId),
]);

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
}, (table) => [
  index('budgets_user_id_idx').on(table.userId),
  index('budgets_user_active_idx').on(table.userId, table.isActive),
]);

// Metas Financeiras
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  categoryId: uuid('category_id').references(() => categories.id),
  status: varchar('status', { length: 20 }).default('active'),
  priority: varchar('priority', { length: 10 }).default('medium'),
  notes: text('notes'),
  monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }),
  goalType: varchar('goal_type', { length: 20 }).default('target'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete
}, (table) => [
  index('goals_user_id_idx').on(table.userId),
]);

export const goalContributions = pgTable('goal_contributions', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('goal_contributions_user_id_idx').on(table.userId),
  index('goal_contributions_goal_id_idx').on(table.goalId),
  index('goal_contributions_goal_month_idx').on(table.goalId, table.month, table.year),
]);

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
}, (table) => [
  index('recurring_user_id_idx').on(table.userId),
  index('recurring_next_due_idx').on(table.nextDueDate),
]);

// Relacionamentos
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  categories: many(categories),
  budgets: many(budgets),
  goals: many(goals),
  goalContributions: many(goalContributions),
  recurringTransactions: many(recurringTransactions),
  notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
  goals: many(goals),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  account: one(accounts, { fields: [goals.accountId], references: [accounts.id] }),
  contributions: many(goalContributions),
}));

export const goalContributionsRelations = relations(goalContributions, ({ one }) => ({
  goal: one(goals, { fields: [goalContributions.goalId], references: [goals.id] }),
  user: one(users, { fields: [goalContributions.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  transactions: many(transactions),
}));

export const tagsRelations = relations(tags, ({ one }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
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
  deletedAt: timestamp('deleted_at'), // Soft-delete
}, (table) => [
  index('credit_cards_user_id_idx').on(table.userId),
]);

// Faturas de Cartão (Persistência de Status Manual)
export const creditCardInvoices = pgTable('credit_card_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => creditCards.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ABERTA'), // 'ABERTA', 'FECHADA', 'PAGA'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('credit_card_invoices_card_idx').on(table.cardId, table.month, table.year),
]);

// Lançamentos de Cartão e outras tabelas...
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
  deletedAt: timestamp('deleted_at'), // Soft-delete
}, (table) => [
  index('card_transactions_invoice_idx').on(table.invoiceMonth, table.invoiceYear),
  index('card_transactions_user_card_invoice_idx').on(table.userId, table.cardId, table.invoiceMonth, table.invoiceYear),
  index('card_transactions_user_invoice_idx').on(table.userId, table.invoiceMonth, table.invoiceYear),
  index('card_transactions_user_id_idx').on(table.userId),
  index('card_transactions_date_idx').on(table.date),
  index('card_transactions_user_id_date_idx').on(table.userId, table.date), // Otimização para relatórios
  index('card_transactions_user_cat_date_idx').on(table.userId, table.categoryId, table.date), // Otimização para orçamentos
]);

// Notificações
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).default('info'), // 'info', 'success', 'warning', 'error'
  isRead: boolean('is_read').default(false),
  link: varchar('link', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_is_read_idx').on(table.isRead),
]);

// Trilha de Auditoria (Para conformidade e depuração em alta escala)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'transaction', 'account', 'budget'
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'manual_balance_adjustment'
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  index('audit_logs_created_at_idx').on(table.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  user: one(users, { fields: [creditCards.userId], references: [users.id] }),
  transactions: many(cardTransactions),
  invoices: many(creditCardInvoices),
}));

export const creditCardInvoicesRelations = relations(creditCardInvoices, ({ one }) => ({
  card: one(creditCards, { fields: [creditCardInvoices.cardId], references: [creditCards.id] }),
  user: one(users, { fields: [creditCardInvoices.userId], references: [users.id] }),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(creditCards, { fields: [cardTransactions.cardId], references: [creditCards.id] }),
  user: one(users, { fields: [cardTransactions.userId], references: [users.id] }),
  category: one(categories, { fields: [cardTransactions.categoryId], references: [categories.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Idempotency Keys (for preventing duplicate requests)
export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  response: jsonb('response').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idempotency_keys_user_key_idx').on(table.userId, table.key),
]);


