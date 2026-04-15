import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: z.string().email("Email inválido").max(255),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter um número"),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(255),
  type: z.enum(["checking", "savings", "credit_card", "investment"]),
  bank: z.string().max(100).optional(),
  agency: z.string().max(20).optional(),
  number: z.string().max(50).optional(),
  balance: z.coerce.number().default(0),
  currency: z.string().length(3).default("BRL"),
  color: z.string().max(7).default("#10B981"),
  includeInTotal: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(50).optional(),
  color: z.string().max(7).default("#10B981"),
  parentId: z.string().uuid().optional().nullable(),
  budgetAmount: z.coerce.number().positive().optional().nullable(),
  budgetPeriod: z.enum(["weekly", "monthly", "yearly"]).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const transactionSchema = z.object({
  accountId: z.string().uuid("Conta inválida"),
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  type: z.enum(["income", "expense", "transfer"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  description: z.string().min(1, "Descrição obrigatória").max(255),
  notes: z.string().max(1000).optional().nullable(),
  isPaid: z.boolean().default(true),
  subtype: z.enum(['single', 'fixed', 'recurring']).default('single'),
  totalOccurrences: z.coerce.number().int().min(2).max(360).optional(),
  dueDate: z.string().optional().nullable(),
  receiveDate: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  location: z.string().max(255).optional().nullable(),
});

export const budgetBaseSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(255),
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().min(1, "Data início obrigatória"),
  endDate: z.string().optional().nullable(),
  alertsEnabled: z.boolean().default(true),
  alertThreshold: z.coerce.number().min(1, "Limite mínimo é 1%").max(100, "Limite máximo é 100%").default(80),
});

export const budgetSchema = budgetBaseSchema.refine((data) => {
  if (data.endDate === undefined || data.startDate === undefined) return true;
  if (data.endDate && data.startDate && data.endDate <= data.startDate) return false;
  return true;
}, { message: "Data de fim deve ser posterior à data de início", path: ["endDate"] });

export const goalBaseSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(255),
  targetAmount: z.coerce.number().positive("Valor alvo deve ser positivo").optional().nullable(),
  currentAmount: z.coerce.number().min(0).default(0),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional().nullable().transform(v => (v === "" ? null : v)),
  goalType: z.enum(["target", "monthly"]).default("target").optional(),
  monthlyContribution: z.coerce.number().positive("Valor mensal deve ser positivo").optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
  notes: z.string().max(1000).optional().nullable(),
});

export const goalSchema = goalBaseSchema.refine((data) => {
  // Ignora validação se algum dos campos de valor estiver ausente (provável update parcial)
  if (data.targetAmount === undefined || data.monthlyContribution === undefined) return true;
  return !!data.targetAmount || !!data.monthlyContribution;
}, {
  message: "Preencha o valor alvo ou o valor mensal",
}).refine((data) => {
  if (data.endDate === undefined || data.startDate === undefined) return true;
  if (data.endDate && data.startDate && data.endDate <= data.startDate) return false;
  return true;
}, { message: "Data de fim deve ser posterior à data de início", path: ["endDate"] });

export const cardTransactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(255),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data obrigatória"),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional().nullable(),
  launchType: z.enum(["single", "installment", "fixed"]),
  invoiceMonth: z.coerce.number().int().min(1).max(12),
  invoiceYear: z.coerce.number().int().min(2020).max(2100),
  totalInstallments: z.coerce.number().int().min(2).max(360).optional().nullable(),
  startInstallment: z.coerce.number().int().min(1).default(1),
  isPending: z.boolean().default(false),
}).refine((data) => {
  if (data.launchType === "installment" && data.totalInstallments && data.startInstallment) {
    return data.startInstallment <= data.totalInstallments;
  }
  return true;
}, {
  message: "Parcela inicial não pode ser maior que o total de parcelas",
  path: ["startInstallment"],
});

export const creditCardBaseSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(255),
  bank: z.string().min(1, "Banco obrigatório").max(100),
  lastDigits: z.string().max(4).optional().nullable(),
  limit: z.coerce.number().positive("Limite deve ser positivo"),
  dueDay: z.coerce.number().int().min(1).max(31, "Dia de vencimento: 1 a 31"),
  closingDay: z.coerce.number().int().min(1).max(31, "Dia de fechamento: 1 a 31"),
  color: z.string().max(7).optional(),
  gradient: z.string().max(100).optional(),
  network: z.string().max(20).optional(),
});

export const creditCardSchema = creditCardBaseSchema.refine((data) => {
  if (data.dueDay !== undefined && data.closingDay !== undefined) {
    return data.dueDay !== data.closingDay;
  }
  return true;
}, {
  message: "Dia de vencimento e dia de fechamento devem ser diferentes",
  path: ["dueDay"],
});

export const goalContributionSchema = z.object({
  goalId: z.string().uuid("Meta inválida"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  amount: z.coerce.number().positive("Valor do aporte deve ser positivo"),
  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  notes: z.string().max(1000).optional().nullable(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().uuid("Conta de origem inválida"),
  toAccountId: z.string().uuid("Conta de destino inválida"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição obrigatória").max(255),
  date: z.string().min(1, "Data obrigatória"),
  categoryId: z.string().uuid().optional().nullable(),
}).refine((data) => {
  if (data.fromAccountId === undefined || data.toAccountId === undefined) return true;
  return data.fromAccountId !== data.toAccountId;
}, {
  message: "As contas de origem e destino devem ser diferentes",
  path: ["toAccountId"],
});

export const goalDepositSchema = z.object({
  goalId: z.string().uuid("Meta inválida"),
  accountId: z.string().uuid("Conta inválida"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data obrigatória").optional().default(() => new Date().toISOString().slice(0, 10)),
  description: z.string().max(255).optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const payInvoiceSchema = z.object({
  cardId: z.string().uuid("Cartão inválido"),
  accountId: z.string().uuid("Conta inválida"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  description: z.string().max(255).optional(),
  date: z.string().min(1, "Data obrigatória"),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const invoiceStatusSchema = z.object({
  status: z.enum(["ABERTA", "FECHADA", "PAGA"]),
});
