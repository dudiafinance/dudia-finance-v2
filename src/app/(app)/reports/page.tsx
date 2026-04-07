"use client";

import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useTransactions, useCategories, useReports } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Gerando relatórios para você...</p>
      </div>
    );
  }

  const maxVal = Math.max(...history.map((h: any) => Math.max(h.income, h.expense)), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Analíticos</h1>
          <p className="text-sm text-slate-500">Visão consolidada de suas finanças e cartões.</p>
        </div>
        <Button onClick={handleExport} className="shadow-lg shadow-emerald-100">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-xl px-6 py-2 text-sm font-bold transition-all",
              period === p 
                ? "bg-white text-emerald-600 shadow-sm scale-105" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Total Receitas", value: fmt(stats.income), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Total Despesas", value: fmt(stats.expense), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
          { label: "Saldo Líquido", value: fmt(stats.net), icon: BarChart3, color: stats.net >= 0 ? "text-blue-600" : "text-amber-600", bg: stats.net >= 0 ? "bg-blue-50" : "bg-amber-50", border: stats.net >= 0 ? "border-blue-100" : "border-amber-100" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn("rounded-3xl p-6 border-b-4 transition-all hover:translate-y-[-2px]", bg, border)}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon className={cn("h-6 w-6", color)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className={cn("text-2xl font-black", color)}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Income by Category */}
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Receitas por Categoria</h2>
            <div className="h-2 w-12 rounded-full bg-emerald-100" />
          </div>
          {incomeByCat.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-300">
              <TrendingUp className="h-12 w-12 mb-2 stroke-1" />
              <p className="text-sm">Nenhuma receita detectada</p>
            </div>
          ) : (
            <div className="space-y-5">
              {incomeByCat.map(({ name, value }: any) => (
                <div key={name} className="group cursor-default">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{name}</span>
                    <span className="text-sm font-black text-slate-900">{fmt(value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                      style={{ width: `${stats.income > 0 ? (value / stats.income) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense by Category */}
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Despesas por Categoria</h2>
            <div className="h-2 w-12 rounded-full bg-red-100" />
          </div>
          {expenseByCat.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-300">
              <TrendingDown className="h-12 w-12 mb-2 stroke-1" />
              <p className="text-sm">Nenhuma despesa detectada</p>
            </div>
          ) : (
            <div className="space-y-5">
              {expenseByCat.map(({ name, value, color }: any) => (
                <div key={name} className="group cursor-default">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase text-[10px] tracking-wider">{name}</span>
                    <span className="text-sm font-black text-slate-900">{fmt(value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
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

      {/* Evolution Chart */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Fluxo de Caixa Histórico</h2>
            <p className="text-xs text-slate-400 font-medium">Evolução de entradas e saídas nos últimos 6 meses</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Despesas</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-64 flex items-end justify-between gap-4 px-4">
          {/* Legend Y-axis (Visual only) */}
          <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between pointer-events-none opacity-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-slate-900" />)}
          </div>

          {history.map((item: any, index: number) => (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="flex w-full items-end justify-center gap-1.5 h-48 relative">
                <div
                  className="w-4 md:w-8 rounded-t-xl bg-emerald-500 group-hover:bg-emerald-600 transition-all duration-500 shadow-md shadow-emerald-500/10"
                  style={{ height: `${(item.income / maxVal) * 100}%`, minHeight: item.income > 0 ? "8px" : "0" }}
                  title={`Receitas: ${fmt(item.income)}`}
                />
                <div
                  className="w-4 md:w-8 rounded-t-xl bg-red-400 group-hover:bg-red-500 transition-all duration-500 shadow-md shadow-red-400/10"
                  style={{ height: `${(item.expense / maxVal) * 100}%`, minHeight: item.expense > 0 ? "8px" : "0" }}
                  title={`Despesas: ${fmt(item.expense)}`}
                />
              </div>
              <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-1">Pronto para aprofundar?</h3>
          <p className="text-slate-400 text-sm max-w-md">Todos os dados acima consideram transações bancárias e de cartões em tempo real.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <TrendingUp className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-white/5 -rotate-12" />
      </div>
    </div>
  );
}
