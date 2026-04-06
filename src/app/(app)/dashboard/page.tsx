"use client";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const now = new Date();
  const month = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const totalBalance = data?.totalBalance ?? 0;
  const totalIncome = data?.totalIncome ?? 0;
  const totalExpense = data?.totalExpense ?? 0;
  const monthlyVariation = data?.monthlyVariation ?? 0;
  const recentActivity: any[] = data?.recentActivity ?? [];
  const goals: any[] = data?.goals ?? [];
  const topExpenses: any[] = data?.topExpenses ?? [];
  const maxExpense = topExpenses.length > 0 ? Math.max(...topExpenses.map((e: any) => e.total)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 capitalize">{month}</p>
      </div>

      {/* Row 1: Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(totalBalance)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            {monthlyVariation >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${monthlyVariation >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {monthlyVariation > 0 ? "+" : ""}{monthlyVariation.toFixed(1)}%
            </span>
            <span className="text-sm text-slate-500">este mês</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Receitas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(totalIncome)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-slate-500">Este mês</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{fmt(totalExpense)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-slate-500">Este mês</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Economia</p>
              <p className={`mt-1 text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {fmt(totalIncome - totalExpense)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-slate-500">Resultado mensal</span>
          </div>
        </div>
      </div>

      {/* Row 2: Top expenses + recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Gastos do Mês</h2>
          {topExpenses.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma despesa categorizada este mês.</p>
          ) : (
            <div className="space-y-4">
              {topExpenses.map((e: any) => (
                <div key={e.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.categoryColor }} />
                      <span className="font-medium text-slate-700">{e.categoryName}</span>
                    </div>
                    <span className="font-semibold text-red-600">{fmt(e.total)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(e.total / maxExpense) * 100}%`,
                        backgroundColor: e.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Últimos Lançamentos</h2>
            <a href="/transactions" className="text-sm text-emerald-600 hover:underline">
              Ver todas
            </a>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum lançamento recente.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((t: any) => (
                <div key={t.source + t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      t.type === "income" ? "bg-emerald-100" : "bg-red-100"
                    )}>
                      {t.source === "card"
                        ? <CreditCard className="h-4 w-4 text-violet-600" />
                        : t.type === "income"
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                          : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900">{t.description}</p>
                        <span className={cn(
                          "rounded-full px-1.5 py-0.5 text-xs font-medium",
                          t.source === "card" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {t.source === "card" ? "Cartão" : "Conta"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold",
                    t.type === "income" ? "text-emerald-600" : "text-red-600"
                  )}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Goals */}
      {goals.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Metas Financeiras</h2>
            <a href="/goals" className="text-sm text-emerald-600 hover:underline">Ver todas</a>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.slice(0, 3).map((g: any) => {
              const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
              return (
                <div key={g.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{g.name}</span>
                    <span className="text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{fmt(Number(g.currentAmount))}</span>
                    <span>{fmt(Number(g.targetAmount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
