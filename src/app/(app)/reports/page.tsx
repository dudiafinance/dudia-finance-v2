"use client";

import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useTransactions, useCategories } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const now = new Date();

  const filtered = useMemo(() => {
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === "month") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      // year
      return d.getFullYear() === now.getFullYear();
    });
  }, [transactions, period]);

  const totalIncome = filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Receitas por categoria
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t: any) => t.type === "income").forEach((t: any) => {
      const cat = categories.find((c: any) => c.id === t.categoryId);
      const name = cat?.name ?? "Outros";
      map[name] = (map[name] ?? 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  // Despesas por categoria
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { value: number; color: string }> = {};
    filtered.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = categories.find((c: any) => c.id === t.categoryId);
      const name = cat?.name ?? "Outros";
      const color = cat?.color ?? "#64748B";
      if (!map[name]) map[name] = { value: 0, color };
      map[name].value += Number(t.amount);
    });
    return Object.entries(map).map(([name, { value, color }]) => ({ name, value, color })).sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  // Evolução mensal (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTxs = transactions.filter((t: any) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      const income = monthTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expense = monthTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      months.push({ month: MONTHS_PT[m], income, expense });
    }
    return months;
  }, [transactions]);

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              period === p ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            )}
          >
            {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Total Receitas", value: fmt(totalIncome), icon: TrendingUp, bg: "bg-emerald-100", text: "text-emerald-600" },
          { label: "Total Despesas", value: fmt(totalExpense), icon: TrendingDown, bg: "bg-red-100", text: "text-red-600" },
          { label: "Saldo Líquido", value: fmt(netBalance), icon: BarChart3, bg: "bg-blue-100", text: netBalance >= 0 ? "text-blue-600" : "text-red-600" },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("h-5 w-5", text)} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className={cn("text-xl font-bold", text)}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Receitas por Categoria</h2>
          {incomeByCategory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Nenhuma receita no período.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {incomeByCategory.map(({ name, value }) => (
                <div key={name}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{name}</span>
                    <span className="text-sm font-medium text-slate-900">{fmt(value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${totalIncome > 0 ? (value / totalIncome) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Despesas por Categoria</h2>
          {expenseByCategory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Nenhuma despesa no período.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {expenseByCategory.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{name}</span>
                    <span className="text-sm font-medium text-slate-900">{fmt(value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${totalExpense > 0 ? (value / totalExpense) * 100 : 0}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly evolution */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Evolução Mensal (últimos 6 meses)</h2>
        <div className="mt-6">
          <div className="flex items-end justify-around gap-4 h-56">
            {monthlyData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="flex w-full items-end justify-center gap-1 h-44">
                  <div
                    className="w-6 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-default"
                    style={{ height: `${(item.income / maxMonthly) * 100}%`, minHeight: item.income > 0 ? "4px" : "0" }}
                    title={`Receitas: ${fmt(item.income)}`}
                  />
                  <div
                    className="w-6 rounded-t bg-red-400 hover:bg-red-500 transition-colors cursor-default"
                    style={{ height: `${(item.expense / maxMonthly) * 100}%`, minHeight: item.expense > 0 ? "4px" : "0" }}
                    title={`Despesas: ${fmt(item.expense)}`}
                  />
                </div>
                <span className="mt-2 text-xs text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-500" />
              <span className="text-xs text-slate-600">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-400" />
              <span className="text-xs text-slate-600">Despesas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
