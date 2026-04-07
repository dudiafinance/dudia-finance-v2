"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useReports } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
          <Button onClick={handleExport} className="font-bold shadow-lg shadow-blue-500/20 px-6">
            <Download className="mr-2 h-5 w-5" />
            Exportar Dados
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl w-fit border border-slate-200/50 dark:border-slate-700/50">
          {(["week", "month", "year"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-2 h-9 rounded-lg text-xs font-bold transition-all shadow-none",
                period === p 
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-transparent"
              )}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Receitas", value: fmt(stats.income), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
            { label: "Total Despesas", value: fmt(stats.expense), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20" },
            { label: "Saldo Líquido", value: fmt(stats.net), icon: BarChart3, color: stats.net >= 0 ? "text-blue-600" : "text-red-600", bg: stats.net >= 0 ? "bg-blue-50 dark:bg-blue-500/10" : "bg-red-50 dark:bg-red-500/10", border: stats.net >= 0 ? "border-blue-100 dark:border-blue-500/20" : "border-red-100 dark:border-red-500/20" },
          ].map(({ label, value, icon: Icon, color, bg, border }, index) => (
            <motion.div 
               key={label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               className={cn("rounded-2xl p-6 border transition-all shadow-sm hover:shadow-md", bg, border)}
            >
              <div className="flex items-center gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700", color)}>
                  <Icon className={cn("h-6 w-6", color)} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className={cn("text-2xl font-bold tracking-tight mt-0.5", color)}>{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Receitas por Categoria</h2>
              <div className="h-2 w-12 rounded-full bg-emerald-500/20" />
            </div>
            {incomeByCat.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <TrendingUp className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma receita registrada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {incomeByCat.map(({ name, value }: any) => (
                  <div key={name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{name}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{fmt(value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.income > 0 ? (value / stats.income) * 100 : 0}%` }}
                        className="h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Expense by Category */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Despesas por Categoria</h2>
              <div className="h-2 w-12 rounded-full bg-red-500/20" />
            </div>
            {expenseByCat.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <TrendingDown className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma despesa registrada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {expenseByCat.map(({ name, value, color }: any) => (
                  <div key={name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{name}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{fmt(value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.expense > 0 ? (value / stats.expense) * 100 : 0}%` }}
                        className="h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                        style={{ 
                          backgroundColor: color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* History Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fluxo de Caixa</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Comparativo de entradas e saídas</p>
            </div>
            <div className="flex gap-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-64 flex items-end justify-between gap-4 px-4 overflow-x-auto">
            {history.map((item: any, index: number) => (
              <div key={index} className="flex flex-col items-center flex-1 min-w-[60px] group">
                <div className="flex items-end justify-center gap-1.5 h-48 relative w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.income / maxVal) * 100}%` }}
                    className="w-8 rounded-t-lg bg-emerald-500/90 transition-all duration-500 hover:bg-emerald-500 cursor-pointer shadow-lg shadow-emerald-500/10"
                    title={`Receitas: ${fmt(item.income)}`}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.expense / maxVal) * 100}%` }}
                    className="w-8 rounded-t-lg bg-red-500/90 transition-all duration-500 hover:bg-red-500 cursor-pointer shadow-lg shadow-red-500/10"
                    title={`Despesas: ${fmt(item.expense)}`}
                  />
                </div>
                <span className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Quer insights mais profundos?</h3>
            <p className="text-sm font-medium text-blue-100/90">Consulte a nossa IA de previsão para planejar seu futuro financeiro com precisão.</p>
          </div>
          <Button 
            asChild
            variant="secondary"
            className="h-12 px-8 font-bold bg-white text-blue-600 hover:bg-blue-50 rounded-xl"
          >
            <a href="/forecast">Ver Previsão Futura</a>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}