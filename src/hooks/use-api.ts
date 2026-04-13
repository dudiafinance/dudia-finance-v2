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
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  
  if (res.status === 204) return {} as T;
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro na requisição");
  return data as T;
}

const FIVE_MINUTES = 5 * 60 * 1000;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar conta", "error"),
  });
}
export function useUpdateAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Account> & { id: string }) => apiFetch<Account>(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar conta", "error"),
  });
}
export function useDeleteAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir conta", "error"),
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
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Category[]>("/api/categories"), staleTime: FIVE_MINUTES });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Category>) => apiFetch<Category>("/api/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar categoria", "error"),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Category> & { id: string }) => apiFetch<Category>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar categoria", "error"),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir categoria", "error"),
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
  return useQuery({ queryKey: ["tags"], queryFn: () => apiFetch<Tag[]>("/api/tags"), staleTime: FIVE_MINUTES });
}
export function useCreateTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Tag>) => apiFetch<Tag>("/api/tags", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar etiqueta", "error"),
  });
}
export function useUpdateTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Tag> & { id: string }) => apiFetch<Tag>(`/api/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar etiqueta", "error"),
  });
}
export function useDeleteTag() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{success: boolean}>(`/api/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir etiqueta", "error"),
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
  items: Transaction[];
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
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => apiFetch<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar transação", "error"),
  });
}
export function useUpdateTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Transaction> & { id: string }) => apiFetch<Transaction>(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar transação", "error"),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir transação", "error"),
  });
}

// Budgets
export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: () => apiFetch<Budget[]>("/api/budgets"), staleTime: FIVE_MINUTES });
}
export function useBudgetStats() {
  return useQuery({ queryKey: ["budget-stats"], queryFn: () => apiFetch<Record<string, unknown>[]>("/api/budgets/stats") });
}
export function useCreateBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => apiFetch<Budget>("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar orçamento", "error"),
  });
}
export function useUpdateBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Budget> & { id: string }) => apiFetch<Budget>(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar orçamento", "error"),
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir orçamento", "error"),
  });
}

// Goals
export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<Goal[]>("/api/goals"), staleTime: FIVE_MINUTES });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => apiFetch<Goal>("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar meta", "error"),
  });
}
export function useUpdateGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Goal> & { id: string }) => apiFetch<Goal>(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar meta", "error"),
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir meta", "error"),
  });
}

export function useGoalDeposit() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: GoalDepositPayload) => apiFetch<{ success: boolean }>("/api/goals/deposit", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao realizar depósito", "error"),
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
    staleTime: ONE_MINUTE,
  });
}

// Reports
export function useReports(period: "week" | "month" | "year") {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: () => apiFetch<ReportSummary>(`/api/reports?period=${period}`),
    staleTime: ONE_MINUTE
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
    staleTime: ONE_MINUTE,
    refetchInterval: ONE_MINUTE, // Atualiza notificações a cada minuto
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
    staleTime: FIVE_MINUTES
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<CreditCard>) => apiFetch<CreditCard>("/api/credit-cards", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar cartão", "error"),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreditCard> & { id: string }) => apiFetch<CreditCard>(`/api/credit-cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar cartão", "error"),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/credit-cards/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir cartão", "error"),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao criar lançamento", "error"),
  });
}

export function useUpdateCardTransaction(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CardTransaction> & { id: string }) => apiFetch<CardTransaction>(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao atualizar lançamento", "error"),
  });
}

export function useDeleteCardTransaction(cardId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: boolean }>(`/api/credit-cards/${cardId}/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["budget-stats"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao excluir lançamento", "error"),
  });
}

export function usePayCardInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch<{ success: boolean }>("/api/credit-cards/pay-invoice", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-cards"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["card-transactions"] });
      qc.invalidateQueries({ queryKey: ["invoice-status"] });
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Erro ao liquidar fatura", "error"),
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

