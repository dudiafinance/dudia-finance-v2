"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Info, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ForecastMonth {
  year: number;
  month: number;
  monthName: string;
  isCurrent: boolean;
  income: number;
  expenses: number;
  cardInvoice: number;
  budgetAllocations: number;
  goalContributions: number;
  netBalance: number;
  cumulativeBalance: number;
}

async function fetchForecast(): Promise<ForecastMonth[]> {
  const res = await fetch("/api/forecast");
  if (!res.ok) throw new Error("Erro ao carregar previsão");
  return res.json();
}

export default function ForecastPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["forecast"],
    queryFn: fetchForecast,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-200" />)}
        </div>
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        Erro ao carregar previsão de saldo.
      </div>
    );
  }

  const totalIncome = data.reduce((s, m) => s + m.income, 0);
  const totalExpenses = data.reduce((s, m) => s + m.expenses + m.cardInvoice, 0);
  const bestMonth = data.reduce((best, m) => m.netBalance > best.netBalance ? m : best, data[0] ?? { netBalance: 0, monthName: "-" } as any);
  const worstMonth = data.reduce((worst, m) => m.netBalance < worst.netBalance ? m : worst, data[0] ?? { netBalance: 0, monthName: "-" } as any);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Previsão de Saldo</h1>
        <p className="text-sm text-slate-500 mt-1">Projeção dos próximos 12 meses</p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Saldo = </span>
          Receitas − Despesas Fixas − Faturas Cartão − Orçamentos − Contribuições para Metas
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Receitas (12m)</p>
          <p className="mt-2 text-xl font-bold text-emerald-600">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Despesas (12m)</p>
          <p className="mt-2 text-xl font-bold text-red-600">{fmt(totalExpenses)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Melhor Mês</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{fmt(bestMonth?.netBalance ?? 0)}</p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{bestMonth?.monthName}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pior Mês</p>
          </div>
          <p className="text-xl font-bold text-red-600">{fmt(worstMonth?.netBalance ?? 0)}</p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{worstMonth?.monthName}</p>
        </div>
      </div>

      {/* Monthly cards */}
      <div className="space-y-3">
        {data.map((m) => {
          const totalCommitments = m.expenses + m.cardInvoice + m.budgetAllocations + m.goalContributions;
          const incomeWidth = m.income > 0
            ? Math.min(100, (m.income / Math.max(m.income, totalCommitments)) * 100)
            : 0;
          const commitWidth = totalCommitments > 0
            ? Math.min(100, (totalCommitments / Math.max(m.income, totalCommitments)) * 100)
            : 0;

          return (
            <div
              key={`${m.year}-${m.month}`}
              className={cn(
                "rounded-xl bg-white p-5 shadow-sm border transition-all",
                m.isCurrent ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-100"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span className={cn("text-sm font-semibold capitalize", m.isCurrent ? "text-emerald-700" : "text-slate-800")}>
                    {m.monthName}
                  </span>
                  {m.isCurrent && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Atual
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className={cn("text-base font-bold", m.netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmt(m.netBalance)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Acumulado: <span className={cn("font-medium", m.cumulativeBalance >= 0 ? "text-slate-700" : "text-red-600")}>{fmt(m.cumulativeBalance)}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-4 sm:grid-cols-3 lg:grid-cols-5">
                <div>
                  <p className="text-xs text-slate-400">Receitas</p>
                  <p className="font-semibold text-emerald-600">{fmt(m.income)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Despesas</p>
                  <p className="font-semibold text-red-600">{fmt(m.expenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fatura Cartão</p>
                  <p className="font-semibold text-violet-600">{fmt(m.cardInvoice)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Orçamentos</p>
                  <p className="font-semibold text-amber-600">{fmt(m.budgetAllocations)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Metas</p>
                  <p className="font-semibold text-blue-600">{fmt(m.goalContributions)}</p>
                </div>
              </div>

              {/* Bar visual */}
              <div className="space-y-1">
                <div className="flex gap-1 items-center">
                  <span className="w-20 text-xs text-slate-400 shrink-0">Receitas</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-emerald-400 rounded-full transition-all" style={{ width: `${incomeWidth}%` }} />
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="w-20 text-xs text-slate-400 shrink-0">Compromissos</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-red-400 rounded-full transition-all" style={{ width: `${commitWidth}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
