"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro na requisição");
  return data as T;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

// Accounts
export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/accounts"), staleTime: FIVE_MINUTES });
}
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/accounts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Categories
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/categories"), staleTime: FIVE_MINUTES });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
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
  return useQuery({ queryKey: ["tags"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/tags"), staleTime: FIVE_MINUTES });
}
export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch<Record<string, unknown>>("/api/tags", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/api/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{success: boolean}>(`/api/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// Transactions
export type TransactionFilters = {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isPaid?: string;
  accountId?: string;
  categoryId?: string;
};

export type PaginatedTransactions = {
  items: Record<string, unknown>[];
  metadata: {
    total: number;
    totalIncome: number;
    totalExpense: number;
    page: number;
    limit: number;
    totalPages: number;
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
    staleTime: ONE_MINUTE
  });
}
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/transactions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}
export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

// Budgets
export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/budgets"), staleTime: FIVE_MINUTES });
}
export function useBudgetStats() {
  return useQuery({ queryKey: ["budget-stats"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/budgets/stats") });
}
export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}
export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

// Goals
export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/goals"), staleTime: FIVE_MINUTES });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useGoalDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/goals/deposit", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
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
    queryFn: () => apiFetch<Record<string, unknown>>(url),
    staleTime: ONE_MINUTE,
  });
}

// Reports
export function useReports(period: "week" | "month" | "year") {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/reports?period=${period}`),
    staleTime: ONE_MINUTE
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<import("@/types").Notification[]>("/api/notifications"),
    staleTime: ONE_MINUTE,
    refetchInterval: ONE_MINUTE, // Atualiza notificações a cada minuto
  });
}
export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string; markAllAsRead?: boolean }) =>
      apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// Credit Cards
export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: () => apiFetch<Record<string, unknown>[]>("/api/credit-cards"),
    staleTime: FIVE_MINUTES
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/credit-cards", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/credit-cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/credit-cards/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useCardTransactions(cardId: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const url = `/api/credit-cards/${cardId}/transactions${params.toString() ? '?' + params.toString() : ''}`;

  return useQuery({
    queryKey: ["card-transactions", cardId, month ?? null, year ?? null],
    queryFn: () => apiFetch<Record<string, unknown>[]>(url),
    staleTime: ONE_MINUTE,
  });
}

export function useCreateCardTransaction(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch(`/api/credit-cards/${cardId}/transactions`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function useUpdateCardTransaction(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => apiFetch(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function useDeleteCardTransaction(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
  });
}

export function usePayCardInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/api/credit-cards/pay-invoice", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
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
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/credit-cards/${cardId}/invoices?month=${month}&year=${year}`),
    enabled: !!cardId && !!month && !!year,
  });
}

export function useUpdateInvoiceStatus(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch(`/api/credit-cards/${cardId}/invoices`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["invoice-status", cardId, variables.month, variables.year] });
    },
  });
}

