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

// Accounts
export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => apiFetch<any[]>("/api/accounts") });
}
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/api/accounts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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

// Categories
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<any[]>("/api/categories") });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/api/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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

// Global Tags
export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: () => apiFetch<string[]>("/api/tags") });
}
export function useUpdateTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: string[]) => apiFetch<string[]>("/api/tags", { method: "PUT", body: JSON.stringify(tags) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// Transactions
export function useTransactions() {
  return useQuery({ queryKey: ["transactions"], queryFn: () => apiFetch<any[]>("/api/transactions") });
}
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/api/transactions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}
export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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
  return useQuery({ queryKey: ["budgets"], queryFn: () => apiFetch<any[]>("/api/budgets") });
}
export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

// Goals
export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<any[]>("/api/goals") });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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

// Dashboard
export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => apiFetch<any>("/api/dashboard") });
}
