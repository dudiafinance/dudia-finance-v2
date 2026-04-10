"use client";

import { useState } from "react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, CreditCard, ChevronLeft, ChevronRight, Eye, EyeOff,
  Target, Zap, BarChart3, Clock, ArrowRight, PieChart
} from "lucide-react";
import { useDashboard } from "@/hooks/use-api";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showBalances, setShowBalances] = useState(true);

  const { data, isLoading } = useDashboard(month, year);

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
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  type ActivityItem = { id: string; source: string; type: string; description: string; date: string; amount: number };
  type GoalItem = { id: string; name: string; currentAmount: number | string; targetAmount: number | string };
  type ExpenseItem = { categoryId: string; categoryName: string; categoryColor: string; total: number };
  
  const dashData = data as Record<string, unknown> | undefined;
  const totalBalance = (dashData?.totalBalance as number) ?? 0;
  const totalIncome = (dashData?.totalIncome as number) ?? 0;
  const totalExpense = (dashData?.totalExpense as number) ?? 0;
  const totalCardInvoice = (dashData?.totalCardInvoice as number) ?? 0;
  const monthlyVariation = (dashData?.monthlyVariation as number) ?? 0;
  const recentActivity: ActivityItem[] = (dashData?.recentActivity as ActivityItem[]) ?? [];
  const goals: GoalItem[] = (dashData?.goals as GoalItem[]) ?? [];
  const topExpenses: ExpenseItem[] = (dashData?.topExpenses as ExpenseItem[]) ?? [];
  const maxExpense = topExpenses.length > 0 ? Math.max(...topExpenses.map((e) => e.total)) : 1;

  const totalAllExpenses = totalExpense + totalCardInvoice;
  const savings = totalIncome - totalAllExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, (savings / totalIncome) * 100) : 0;

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Visão Analítica</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border shadow-precision">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <button
                onClick={goToCurrentMonth}
                className="px-3 text-[10px] font-bold uppercase tracking-wider text-foreground hover:opacity-70"
              >
                {MONTH_NAMES[month - 1]} {year}
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="h-9 gap-2 text-[10px] font-bold uppercase border-border shadow-precision px-4"
            >
              {showBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showBalances ? "Ocultar" : "Mostrar"}</span>
            </Button>
          </div>
        </div>

        {/* Patrimônio Section */}
        <div className="mt-12">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Patrimônio Consolidado</span>
            <div className="flex items-baseline gap-4">
              <p className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums text-foreground">
                {showBalances ? fmt(totalBalance) : "••••••••"}
              </p>
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border tabular-nums shadow-precision",
                monthlyVariation >= 0 ? "bg-success-subtle text-success border-success-subtle" : "bg-error-subtle text-error border-error-subtle"
              )}>
                {monthlyVariation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(monthlyVariation).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-8">
        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mb-12 shadow-precision">
          <div className="bg-background p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ArrowUpRight className="h-3 w-3 text-success" />
              Receitas do Mês
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">{showBalances ? fmt(totalIncome) : "••••••"}</p>
          </div>

          <div className="bg-background p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ArrowDownRight className="h-3 w-3 text-error" />
              Despesas Acumuladas
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums text-foreground">{showBalances ? fmt(totalAllExpenses) : "••••••"}</p>
              <span className="text-[9px] font-bold text-muted-foreground uppercase border-l border-border pl-2">
                Cartão: {fmt(totalCardInvoice)}
              </span>
            </div>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-warning" />
                Economia Líquida
              </p>
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{savingsRate.toFixed(1)}%</span>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums", savings >= 0 ? "text-foreground" : "text-error")}>
              {showBalances ? fmt(savings) : "••••••"}
            </p>
            <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                className="h-full bg-foreground rounded-full" 
              />
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Top Expenses */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Distribuição de Gastos</h2>
            </div>

            <div className="bg-background rounded-lg border border-border/50 p-6 space-y-6 shadow-precision">
              {topExpenses.length === 0 ? (
                <div className="py-12 text-center opacity-30">
                  <BarChart3 className="h-8 w-8 mx-auto mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sem dados</p>
                </div>
              ) : (
                topExpenses.map((e) => (
                  <div key={e.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{e.categoryName}</span>
                      <span className="text-xs font-bold tabular-nums text-foreground">{fmt(e.total)}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(e.total / maxExpense) * 100}%` }}
                        className="h-full bg-foreground/40 rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Atividade Recente</h2>
              </div>
              <a href="/transactions" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                Ver Tudo
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
              {recentActivity.length === 0 ? (
                <div className="p-20 text-center opacity-30">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum lançamento</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentActivity.map((t) => (
                    <motion.div
                      key={t.source + t.id}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded flex items-center justify-center shrink-0 border border-border/50",
                        t.type === "income" ? "text-success" : "text-foreground"
                      )}>
                        {t.source === "card" ? <CreditCard className="h-4 w-4" />
                          : t.type === "income" ? <ArrowUpRight className="h-4 w-4" />
                          : <ArrowDownRight className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate tracking-tight">{t.description}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} • {t.source === "card" ? "Crédito" : "Corrente"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold tabular-nums tracking-tight",
                          t.type === "income" ? "text-emerald-500" : "text-foreground"
                        )}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        {goals.length > 0 && (
          <section className="mt-16 space-y-6">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Metas em Foco</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
                return (
                  <div key={g.id} className="bg-background rounded-lg border border-border/50 p-6 shadow-precision group hover:border-border transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-foreground text-sm tracking-tight mb-1">{g.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">{fmt(Number(g.currentAmount))} / {fmt(Number(g.targetAmount))}</p>
                      </div>
                      <div className="text-[10px] font-bold tabular-nums text-foreground bg-secondary px-2 py-0.5 rounded border border-border/50">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                    
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-foreground rounded-full"
                      />
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
