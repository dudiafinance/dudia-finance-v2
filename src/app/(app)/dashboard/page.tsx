"use client";

import { useState, useMemo } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, CreditCard, ChevronLeft, ChevronRight, Eye, EyeOff,
  Target, Zap, Crown, BarChart3, Clock, ArrowRight,
  Receipt, Landmark, MoreHorizontal, PieChart
} from "lucide-react";
import { useDashboard } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showBalances, setShowBalances] = useState(true);

  const { data, isLoading } = useDashboard(month, year);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const navigateMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const goToCurrentMonth = () => {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Consolidando dados financeiros...</p>
      </div>
    );
  }

  const totalBalance = data?.totalBalance ?? 0;
  const totalIncome = data?.totalIncome ?? 0;
  const totalExpense = data?.totalExpense ?? 0;
  const totalCardInvoice = data?.totalCardInvoice ?? 0;
  const monthlyVariation = data?.monthlyVariation ?? 0;
  const recentActivity: any[] = data?.recentActivity ?? [];
  const goals: any[] = data?.goals ?? [];
  const topExpenses: any[] = data?.topExpenses ?? [];
  const maxExpense = topExpenses.length > 0 ? Math.max(...topExpenses.map((e: any) => e.total)) : 1;

  const totalAllExpenses = totalExpense + totalCardInvoice;
  const savings = totalIncome - totalAllExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-blue-500 rounded-full" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                variant={isCurrentMonth ? "default" : "secondary"}
                onClick={goToCurrentMonth}
                className="px-6"
              >
                {MONTH_NAMES[month - 1]} {year}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                className="text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowBalances(!showBalances)}
            className="gap-3 self-start md:self-auto bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
          >
            <div className="h-8 w-8 flex items-center justify-center rounded bg-slate-700">
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </div>
            <span>{showBalances ? "Ocultar" : "Mostrar"} Patrimônio</span>
          </Button>
        </div>

        {/* Patrimônio Section */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Patrimônio Consolidado</span>
              </div>
              <p className="text-5xl md:text-6xl font-bold text-white tracking-tight tabular-nums">
                {showBalances ? fmt(totalBalance) : "••••••••"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold",
                monthlyVariation >= 0 ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-red-900/50 text-red-400 border border-red-800"
              )}>
                {monthlyVariation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(monthlyVariation).toFixed(1)}%</span>
              </div>
              <span className="text-slate-400 text-sm">variação mensal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Receitas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{showBalances ? fmt(totalIncome) : "••••••"}</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Despesas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{showBalances ? fmt(totalAllExpenses) : "••••••"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Fixas: {fmt(totalExpense)}</span>
              <span className="px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/30 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Cartão: {fmt(totalCardInvoice)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Economia Líquida</p>
                <p className={cn("text-2xl font-bold", savings >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {showBalances ? fmt(savings) : "••••••"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Taxa de Poupança</span>
                <span className="text-slate-700 dark:text-slate-200">{Math.max(0, savingsRate).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Expenses */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Análise de Gastos</h2>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-5">
              {topExpenses.length === 0 ? (
                <div className="py-10 text-center">
                  <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Sem despesas</p>
                </div>
              ) : (
                topExpenses.map((e: any) => (
                  <div key={e.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.categoryColor }} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{e.categoryName}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{fmt(e.total)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(e.total / maxExpense) * 100}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: e.categoryColor }}
                      />
                    </div>
                  </div>
                ))
              )}
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full gap-2 text-xs uppercase tracking-wider text-slate-500 font-bold"
              >
                <MoreHorizontal className="h-4 w-4" /> Ver mais
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lançamentos Recentes</h2>
              </div>
              <a href="/transactions" className="h-9 px-4 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                Ver Extrato
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-10 text-center shadow-sm">
                  <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Histórico vazio</p>
                </div>
              ) : (
                recentActivity.map((t: any) => (
                  <motion.div
                    key={t.source + t.id}
                    whileHover={{ x: 4 }}
                    className="group flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
                  >
                    <div className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                      t.type === "income" ? "bg-emerald-500" : "bg-red-500"
                    )} />

                    <div className={cn(
                      "h-11 w-11 rounded-lg flex items-center justify-center shrink-0",
                      t.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                    )}>
                      {t.source === "card" ? <CreditCard className="h-5 w-5 text-violet-600" />
                        : t.type === "income" ? <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                        : <ArrowDownRight className="h-5 w-5 text-red-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{t.description}</h3>
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                          t.source === "card" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        )}>
                          {t.source === "card" ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
                          {t.source === "card" ? "Crédito" : "Corrente"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold tabular-nums tracking-tight",
                        t.type === "income" ? "text-emerald-600" : "text-red-600"
                      )}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        {goals.length > 0 && (
          <section className="mt-10 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Metas em Foco</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {goals.slice(0, 3).map((g: any) => {
                const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
                return (
                  <div key={g.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-0.5">{g.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{fmt(Number(g.currentAmount))} de {fmt(Number(g.targetAmount))}</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-blue-500">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Em andamento</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-500"
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}