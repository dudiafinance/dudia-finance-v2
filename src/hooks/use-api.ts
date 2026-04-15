"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import type { 
  Account, 
  Category, 
  Tag, 
  Transaction, 
  Budget, 
  Goal, 
  CreditCard, 
  CardTransaction, 
  Notification,
  DashboardSummary,
  ReportSummary,
  TransferPayload,
  GoalDepositPayload,
  InvoiceStatusResponse
} from "@/types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const isFormDataBody = options?.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") ?? "";
  let data: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    data = text || null;
  }

  if (!res.ok) {
    const jsonError =
      data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : null;
    const textError = typeof data === "string" ? data : null;
    throw new Error(jsonError ?? textError ?? `Erro na requisição (${res.status})`);
  }

  return data as T;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const THREE_MINUTES = 3 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

// Accounts
export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => apiFetch<Account[]>("/api/accounts"), staleTime: FIVE_MINUTES });
}
export function useCreateAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Account>) => apiFetch<Account>("/api/accounts", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newAccount) => {
      await qc.cancelQueries({ queryKey: ["accounts"] });
      const previous = qc.getQueryData<Account[]>(["accounts"]);
      const optimisticAccount: Account = {
        id: crypto.randomUUID(),
        userId: "",
        name: newAccount.name ?? "",
        type: newAccount.type ?? "checking",
        balance: newAccount.balance ?? 0,
        currency: newAccount.currency ?? "BRL",
        icon: newAccount.icon,
        color: newAccount.color ?? "#3B82F6",
        isActive: true,
        includeInTotal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      qc.setQueryData<Account[]>(["accounts"], (old) => old ? [...old, optimisticAccount] : [optimisticAccount]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["accounts"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar conta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
export function useUpdateAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Account> & { id: string }) => apiFetch<Account>(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["accounts"] });
      const previous = qc.getQueryData<Account[]>(["accounts"]);
      qc.setQueryData<Account[]>(["accounts"], (old) => old?.map((a) => a.id === id ? { ...a, ...updatedFields, updatedAt: new Date() } : a));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["accounts"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar conta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
export function useDeleteAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/accounts/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["accounts"] });
      const previous = qc.getQueryData<Account[]>(["accounts"]);
      qc.setQueryData<Account[]>(["accounts"], (old) => old?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["accounts"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir conta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: TransferPayload) => apiFetch<{ success: boolean }>("/api/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar transferência", "error"),
  });
}

// Categories
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Category[]>("/api/categories"), staleTime: 10 * 60 * 1000 });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Category>) => apiFetch<Category>("/api/categories", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newCategory) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const previous = qc.getQueryData<Category[]>(["categories"]);
      const optimisticCategory: Category = {
        id: crypto.randomUUID(),
        userId: "",
        name: newCategory.name ?? "",
        type: newCategory.type ?? "expense",
        icon: newCategory.icon,
        color: newCategory.color ?? "#6B7280",
        isActive: true,
        order: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      qc.setQueryData<Category[]>(["categories"], (old) => old ? [...old, optimisticCategory] : [optimisticCategory]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["categories"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar categoria", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Category> & { id: string }) => apiFetch<Category>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const previous = qc.getQueryData<Category[]>(["categories"]);
      qc.setQueryData<Category[]>(["categories"], (old) => old?.map((c) => c.id === id ? { ...c, ...updatedFields, updatedAt: new Date() } : c));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["categories"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar categoria", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/categories/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const previous = qc.getQueryData<Category[]>(["categories"]);
      qc.setQueryData<Category[]>(["categories"], (old) => old?.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["categories"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir categoria", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCategoryStats(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString();
  const url = qs ? `/api/categories/stats?${qs}` : "/api/categories/stats";
  return useQuery({ queryKey: ["category-stats", month ?? null, year ?? null], queryFn: () => apiFetch<Record<string, number>>(url) });
}

// Global Tags
export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: () => apiFetch<Tag[]>("/api/tags"), staleTime: 10 * 60 * 1000 });
}
export function useCreateTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Tag>) => apiFetch<Tag>("/api/tags", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newTag) => {
      await qc.cancelQueries({ queryKey: ["tags"] });
      const previous = qc.getQueryData<Tag[]>(["tags"]);
      const optimisticTag: Tag = {
        id: crypto.randomUUID(),
        userId: "",
        name: newTag.name ?? "",
        color: newTag.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      qc.setQueryData<Tag[]>(["tags"], (old) => old ? [...old, optimisticTag] : [optimisticTag]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["tags"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar etiqueta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useUpdateTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Tag> & { id: string }) => apiFetch<Tag>(`/api/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["tags"] });
      const previous = qc.getQueryData<Tag[]>(["tags"]);
      qc.setQueryData<Tag[]>(["tags"], (old) => old?.map((t) => t.id === id ? { ...t, ...updatedFields } : t));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["tags"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar etiqueta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useDeleteTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{success: boolean}>(`/api/tags/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tags"] });
      const previous = qc.getQueryData<Tag[]>(["tags"]);
      qc.setQueryData<Tag[]>(["tags"], (old) => old?.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["tags"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir etiqueta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// Transactions
export type TransactionFilters = {
  month?: number;
  year?: number;
  cursor?: string;
  limit?: number;
  search?: string;
  type?: string;
  isPaid?: string;
  accountId?: string;
  categoryId?: string;
};

export type PaginatedTransactions = {
  items: Transaction[];
  nextCursor: string | null;
  metadata: {
    total: number;
    totalIncome: number;
    totalExpense: number;
    limit: number;
    hasMore: boolean;
  };
};

export function useTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  const url = qs ? `/api/transactions?${qs}` : "/api/transactions";

  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => apiFetch<PaginatedTransactions>(url),
    staleTime: TWO_MINUTES
  });
}
export function useCreateTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => apiFetch<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newTransaction) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      const previousData = qc.getQueryData<PaginatedTransactions>(["transactions"]);
      
      const optimisticTransaction: Transaction = {
        id: crypto.randomUUID(),
        userId: "",
        accountId: newTransaction.accountId ?? "",
        categoryId: newTransaction.categoryId,
        amount: typeof newTransaction.amount === "number" ? newTransaction.amount : Number(newTransaction.amount) || 0,
        type: newTransaction.type ?? "expense",
        description: newTransaction.description ?? "",
        date: newTransaction.date ? new Date(newTransaction.date) : new Date(),
        isPaid: newTransaction.isPaid ?? false,
        notes: newTransaction.notes,
        tags: newTransaction.tags ?? [],
        location: newTransaction.location,
        isRecurring: false,
        recurringId: undefined,
        dueDate: newTransaction.dueDate,
        receiveDate: newTransaction.receiveDate,
        attachments: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      qc.setQueryData<PaginatedTransactions>(["transactions"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: [optimisticTransaction, ...old.items],
          metadata: {
            ...old.metadata,
            total: old.metadata.total + 1,
          },
        };
      });

      return { previousData };
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        qc.setQueryData(["transactions"], context.previousData);
      }
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast(err instanceof Error ? err.message : "Erro ao criar transação", "error");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}
export function useUpdateTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Transaction> & { id: string }) => apiFetch<Transaction>(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      const previousData = qc.getQueryData<PaginatedTransactions>(["transactions"]);

      qc.setQueryData<PaginatedTransactions>(["transactions"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === id ? { ...item, ...updatedFields, updatedAt: new Date() } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        qc.setQueryData(["transactions"], context.previousData);
      }
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast(err instanceof Error ? err.message : "Erro ao atualizar transação", "error");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, mode }: { id: string; mode?: 'single' | 'all' }) => {
      const url = mode ? `/api/transactions/${id}?mode=${mode}` : `/api/transactions/${id}`;
      return apiFetch<{ success: boolean }>(url, { method: "DELETE" });
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      const previousData = qc.getQueryData<PaginatedTransactions>(["transactions"]);

      qc.setQueryData<PaginatedTransactions>(["transactions"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item) => item.id !== id),
          metadata: {
            ...old.metadata,
            total: Math.max(0, old.metadata.total - 1),
          },
        };
      });

      return { previousData };
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        qc.setQueryData(["transactions"], context.previousData);
      }
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast(err instanceof Error ? err.message : "Erro ao excluir transação", "error");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

// Budgets
export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: () => apiFetch<Budget[]>("/api/budgets"), staleTime: THREE_MINUTES });
}
export function useBudgetStats() {
  return useQuery({ queryKey: ["budget-stats"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/budgets/stats") });
}
export function useCreateBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => apiFetch<Budget>("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newBudget) => {
      await qc.cancelQueries({ queryKey: ["budgets"] });
      const previous = qc.getQueryData<Budget[]>(["budgets"]);
      const optimisticBudget: Budget = {
        id: crypto.randomUUID(),
        userId: "",
        name: newBudget.name ?? "",
        categoryId: newBudget.categoryId ?? "",
        amount: newBudget.amount ?? 0,
        period: newBudget.period ?? "monthly",
        startDate: newBudget.startDate ?? new Date(),
        isActive: true,
        alertsEnabled: true,
        alertThreshold: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      qc.setQueryData<Budget[]>(["budgets"], (old) => old ? [...old, optimisticBudget] : [optimisticBudget]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["budgets"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar orçamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}
export function useUpdateBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Budget> & { id: string }) => apiFetch<Budget>(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["budgets"] });
      const previous = qc.getQueryData<Budget[]>(["budgets"]);
      qc.setQueryData<Budget[]>(["budgets"], (old) => old?.map((b) => b.id === id ? { ...b, ...updatedFields, updatedAt: new Date() } : b));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["budgets"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar orçamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/budgets/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["budgets"] });
      const previous = qc.getQueryData<Budget[]>(["budgets"]);
      qc.setQueryData<Budget[]>(["budgets"], (old) => old?.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["budgets"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir orçamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

// Goals
export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<Goal[]>("/api/goals"), staleTime: THREE_MINUTES });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => apiFetch<Goal>("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newGoal) => {
      await qc.cancelQueries({ queryKey: ["goals"] });
      const previous = qc.getQueryData<Goal[]>(["goals"]);
      const optimisticGoal: Goal = {
        id: crypto.randomUUID(),
        userId: "",
        name: newGoal.name ?? "",
        targetAmount: newGoal.targetAmount ?? 0,
        currentAmount: 0,
        startDate: new Date(),
        status: "active",
        priority: "medium",
        goalType: newGoal.goalType ?? "target",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      qc.setQueryData<Goal[]>(["goals"], (old) => old ? [...old, optimisticGoal] : [optimisticGoal]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["goals"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar meta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useUpdateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Goal> & { id: string }) => apiFetch<Goal>(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["goals"] });
      const previous = qc.getQueryData<Goal[]>(["goals"]);
      qc.setQueryData<Goal[]>(["goals"], (old) => old?.map((g) => g.id === id ? { ...g, ...updatedFields, updatedAt: new Date() } : g));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["goals"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar meta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/goals/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["goals"] });
      const previous = qc.getQueryData<Goal[]>(["goals"]);
      qc.setQueryData<Goal[]>(["goals"], (old) => old?.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["goals"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir meta", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useGoalDeposit() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: GoalDepositPayload) => apiFetch<{ success: boolean }>("/api/goals/deposit", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async ({ goalId, amount }) => {
      await qc.cancelQueries({ queryKey: ["goals"] });
      const previous = qc.getQueryData<Goal[]>(["goals"]);
      qc.setQueryData<Goal[]>(["goals"], (old) => old?.map((g) => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount, updatedAt: new Date() } : g));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["goals"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao realizar depósito", "error");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Dashboard – now accepts month/year
export function useDashboard(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString();
  const url = qs ? `/api/dashboard?${qs}` : "/api/dashboard";

  return useQuery({
    queryKey: ["dashboard", month ?? null, year ?? null],
    queryFn: () => apiFetch<DashboardSummary>(url),
    staleTime: FIVE_MINUTES,
  });
}

// Reports
export function useReports(period: "week" | "month" | "year") {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: () => apiFetch<ReportSummary>(`/api/reports?period=${period}`),
    staleTime: FIVE_MINUTES
  });
}

export function useNotifications() {
  const qc = useQueryClient();
  const toast = useToast();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
    staleTime: THREE_MINUTES,
    refetchInterval: FIVE_MINUTES,
    refetchIntervalInBackground: false,
  });
}

export function useNotificationsSSE() {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["notifications-sse"],
    queryFn: async () => {
      return new Promise<Notification[]>((resolve, reject) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            eventSource.close();
            reject(new Error("SSE timeout"));
          }
        }, 20000);

        const eventSource = new EventSource("/api/notifications/stream");

        eventSource.addEventListener("notifications", (e) => {
          resolved = true;
          clearTimeout(timeout);
          const data = JSON.parse(e.data) as Notification[];
          qc.setQueryData(["notifications"], data);
          resolve(data);
          eventSource.close();
        });

        eventSource.onerror = () => {
          if (!resolved) {
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error("SSE connection failed"));
          }
        };
      });
    },
    staleTime: THREE_MINUTES,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { id?: string; markAllAsRead?: boolean }) =>
      apiFetch<{ success: boolean }>("/api/notifications", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar notificações", "error"),
  });
}

// Credit Cards
export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: () => apiFetch<CreditCard[]>("/api/credit-cards"),
    staleTime: THREE_MINUTES
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<CreditCard>) => apiFetch<CreditCard>("/api/credit-cards", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newCard) => {
      await qc.cancelQueries({ queryKey: ["credit-cards"] });
      const previous = qc.getQueryData<CreditCard[]>(["credit-cards"]);
      const optimisticCard: CreditCard = {
        id: crypto.randomUUID(),
        userId: "",
        name: newCard.name ?? "",
        bank: newCard.bank ?? "",
        lastDigits: newCard.lastDigits ?? "****",
        limit: newCard.limit ?? 0,
        usedAmount: 0,
        dueDay: newCard.dueDay ?? 1,
        closingDay: newCard.closingDay ?? 15,
        color: newCard.color ?? "#3B82F6",
        gradient: newCard.gradient ?? "from-blue-500 to-blue-600",
        network: newCard.network ?? "visa",
        isActive: true,
      };
      qc.setQueryData<CreditCard[]>(["credit-cards"], (old) => old ? [...old, optimisticCard] : [optimisticCard]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["credit-cards"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar cartão", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreditCard> & { id: string }) => apiFetch<CreditCard>(`/api/credit-cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["credit-cards"] });
      const previous = qc.getQueryData<CreditCard[]>(["credit-cards"]);
      qc.setQueryData<CreditCard[]>(["credit-cards"], (old) => old?.map((c) => c.id === id ? { ...c, ...updatedFields, updatedAt: new Date() } : c));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["credit-cards"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar cartão", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/credit-cards/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["credit-cards"] });
      const previous = qc.getQueryData<CreditCard[]>(["credit-cards"]);
      qc.setQueryData<CreditCard[]>(["credit-cards"], (old) => old?.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["credit-cards"], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir cartão", "error");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useCardTransactions(cardId: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const url = `/api/credit-cards/${cardId}/transactions${params.toString() ? '?' + params.toString() : ''}`;

  return useQuery({
    queryKey: ["card-transactions", cardId, month ?? null, year ?? null],
    queryFn: () => apiFetch<CardTransaction[]>(url),
    staleTime: ONE_MINUTE,
    enabled: !!cardId && cardId !== "undefined" && cardId !== "null",
  });
}

export function useCreateCardTransaction(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<CardTransaction>) => apiFetch<CardTransaction>(`/api/credit-cards/${cardId}/transactions`, { method: "POST", body: JSON.stringify(data) }),
    onMutate: async (newTx) => {
      await qc.cancelQueries({ queryKey: ["card-transactions", cardId] });
      const previous = qc.getQueryData<CardTransaction[]>(["card-transactions", cardId]);
      const optimisticTx: CardTransaction = {
        id: crypto.randomUUID(),
        cardId,
        description: newTx.description ?? "",
        categoryId: newTx.categoryId ?? "",
        amount: typeof newTx.amount === "number" ? newTx.amount : Number(newTx.amount) || 0,
        date: newTx.date ?? new Date(),
        isPending: true,
      };
      qc.setQueryData<CardTransaction[]>(["card-transactions", cardId], (old) => old ? [optimisticTx, ...old] : [optimisticTx]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["card-transactions", cardId], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao criar lançamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function useUpdateCardTransaction(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CardTransaction> & { id: string }) => apiFetch<CardTransaction>(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onMutate: async ({ id, ...updatedFields }) => {
      await qc.cancelQueries({ queryKey: ["card-transactions", cardId] });
      const previous = qc.getQueryData<CardTransaction[]>(["card-transactions", cardId]);
      qc.setQueryData<CardTransaction[]>(["card-transactions", cardId], (old) => old?.map((t) => t.id === id ? { ...t, ...updatedFields, updatedAt: new Date() } : t));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["card-transactions", cardId], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao atualizar lançamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function useDeleteCardTransaction(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["card-transactions", cardId] });
      const previous = qc.getQueryData<CardTransaction[]>(["card-transactions", cardId]);
      qc.setQueryData<CardTransaction[]>(["card-transactions", cardId], (old) => old?.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["card-transactions", cardId], context.previous);
      toast(_err instanceof Error ? _err.message : "Erro ao excluir lançamento", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function usePayCardInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch<{ success: boolean }>("/api/credit-cards/pay-invoice", { method: "POST", body: JSON.stringify(data) }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["credit-cards"] });
      await qc.cancelQueries({ queryKey: ["accounts"] });
      await qc.cancelQueries({ queryKey: ["transactions"] });
      await qc.cancelQueries({ queryKey: ["card-transactions"] });
    },
    onError: () => {
      toast("Erro ao liquidar fatura", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["card-transactions"] });
      qc.invalidateQueries({ queryKey: ["invoice-status"] });
    },
  });
}

export function useInvoiceStatus(cardId: string, month: number, year: number) {
  return useQuery({
    queryKey: ["invoice-status", cardId, month, year],
    queryFn: () => apiFetch<InvoiceStatusResponse>(`/api/credit-cards/${cardId}/invoices?month=${month}&year=${year}`),
    enabled: !!cardId && !!month && !!year,
  });
}

export function useUpdateInvoiceStatus(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { month: number; year: number; status: string }) => apiFetch<{ success: boolean }>(`/api/credit-cards/${cardId}/invoices`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["invoice-status", cardId, variables.month, variables.year] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar status da fatura", "error"),
  });
}
