export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: string;
  locale: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  bank?: string;
  agency?: string;
  number?: string;
  balance: number;
  currency: string;
  color: string;
  icon?: string;
  isActive: boolean;
  includeInTotal: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
  parentId?: string;
  budgetAmount?: number;
  budgetPeriod?: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  order: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  description: string;
  notes?: string;
  isRecurring: boolean;
  recurringId?: string;
  isPaid: boolean;
  dueDate?: Date;
  receiveDate?: Date;
  attachments?: string[];
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Budget = {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  alertsEnabled: boolean;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Goal = {
  id: string;
  userId: string;
  accountId?: string;
  name: string;
  targetAmount?: number;
  currentAmount: number;
  startDate: Date;
  endDate?: Date;
  categoryId?: string;
  status: 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  monthlyContribution?: number;
  goalType: 'target' | 'monthly';
  createdAt: Date;
  updatedAt: Date;
};

export type GoalContribution = {
  id: string;
  goalId: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  originalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RecurringTransaction = {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  nextDueDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DashboardSummary = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyVariation: number;
  totalAllExpenses: number;
  totalCardInvoice: number;
  savings: number;
  savingsRate: number;
  topExpenses: {
    categoryId: string;
    categoryName: string;
    total: number;
  }[];
  recentActivity: {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    source: 'account' | 'card';
  }[];
};

export type ReportSummary = {
  stats: {
    income: number;
    expense: number;
    net: number;
  };
  incomeByCat: { name: string; value: number }[];
  expenseByCat: { name: string; value: number; color?: string }[];
  history: { label: string; income: number; expense: number }[];
};

export type TransferPayload = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
};

export type GoalDepositPayload = {
  goalId: string;
  accountId: string;
  amount: number;
  date: string;
  description: string;
};

export type InvoiceStatusResponse = {
  status: 'ABERTA' | 'FECHADA' | 'PAGA';
};

export type ChartData = {
  name: string;
  value: number;
  color?: string;
};

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreditCard = {
  id: string;
  userId: string;
  name: string;
  bank: string;
  lastDigits: string;
  limit: number;
  usedAmount: number;
  dueDay: number;
  closingDay: number;
  color: string;
  gradient: string;
  network: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard';
  isActive: boolean;
};

export type CardInvoice = {
  id: string;
  cardId: string;
  month: string;
  year: number;
  total: number;
  status: 'open' | 'closed' | 'paid';
  dueDate: Date;
  transactions: CardTransaction[];
};

export type CardTransaction = {
  id: string;
  cardId: string;
  description: string;
  categoryId: string;
  amount: number;
  date: Date;
  installments?: number;
  currentInstallment?: number;
  isPending: boolean;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
};
