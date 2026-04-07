"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useReports } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { data, isLoading } = useReports(period);

  const stats = data?.summary ?? { income: 0, expense: 0, net: 0 };
  const incomeByCat = data?.categories?.income ?? [];
  const expenseByCat = data?.categories?.expense ?? [];
  const history = data?.history ?? [];

  const handleExport = () => {
    if (!data) return;
    
    let csv = "Tipo,Categoria,Valor\n";
    incomeByCat.forEach((c: any) => csv += `Receita,${c.name},${c.value}\n`);
    expenseByCat.forEach((c: any) => csv += `Despesa,${c.name},${c.value}\n`);
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio_${period}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const maxVal = Math.max(...history.map((h: any) => Math.max(h.income, h.expense)), 1);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
            <p className="text-sm text-slate-500 mt-1">Visão consolidada das suas finanças.</p>
          </div>
          <Button onClick={handleExport} className="rounded-lg font-semibold bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-5 py-2 rounded-md text-sm font-medium transition-all",
                period === p 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Receitas", value: fmt(stats.income), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
            { label: "Total Despesas", value: fmt(stats.expense), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
            { label: "Saldo Líquido", value: fmt(stats.net), icon: BarChart3, color: stats.net >= 0 ? "text-blue-600" : "text-red-600", bg: stats.net >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20", border: stats.net >= 0 ? "border-blue-200 dark:border-blue-800" : "border-red-200 dark:border-red-800" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={cn("rounded-lg p-5 border transition-all", bg, border)}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm", color)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Receitas por Categoria</h2>
              <div className="h-2 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30" />
            </div>
            {incomeByCat.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <TrendingUp className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhuma receita registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomeByCat.map(({ name, value }: any) => (
                  <div key={name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{name}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${stats.income > 0 ? (value / stats.income) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense by Category */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Despesas por Categoria</h2>
              <div className="h-2 w-8 rounded-full bg-red-100 dark:bg-red-900/30" />
            </div>
            {expenseByCat.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <TrendingDown className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhuma despesa registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenseByCat.map(({ name, value, color }: any) => (
                  <div key={name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{name}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${stats.expense > 0 ? (value / stats.expense) * 100 : 0}%`, 
                          backgroundColor: color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fluxo de Caixa</h2>
              <p className="text-xs text-slate-500">Entradas e saídas dos últimos meses</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-500">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-slate-500">Despesas</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-52 flex items-end justify-between gap-2 px-2">
            {history.map((item: any, index: number) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="flex items-end justify-center gap-1 h-44 relative w-full">
                  <div
                    className="w-6 rounded-t-md bg-emerald-500 transition-all duration-500 hover:bg-emerald-600"
                    style={{ height: `${(item.income / maxVal) * 100}%`, minHeight: item.income > 0 ? "4px" : "0" }}
                    title={`Receitas: ${fmt(item.income)}`}
                  />
                  <div
                    className="w-6 rounded-t-md bg-red-500 transition-all duration-500 hover:bg-red-600"
                    style={{ height: `${(item.expense / maxVal) * 100}%`, minHeight: item.expense > 0 ? "4px" : "0" }}
                    title={`Despesas: ${fmt(item.expense)}`}
                  />
                </div>
                <span className="mt-3 text-[10px] font-medium text-slate-400 uppercase">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-blue-600 rounded-lg p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Quer mais insights?</h3>
            <p className="text-sm text-blue-100">Consulte a previsão de gastos para planejar seu futuro.</p>
          </div>
          <a 
            href="/forecast" 
            className="px-5 py-2.5 rounded-md bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Ver Previsão
          </a>
        </div>
      </div>
    </div>
  );
}