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
import { useSession } from "next-auth/react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
            
            <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-md border border-border">
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
                className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
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
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
            className="h-8 gap-2 text-xs font-bold"
          >
            {showBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showBalances ? "Ocultar" : "Mostrar"} Valores</span>
          </Button>
        </div>

        {/* Patrimônio Section */}
        <div className="mt-10">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Patrimônio Consolidado</span>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl md:text-5xl font-bold tracking-tighter tabular-nums text-foreground">
                {showBalances ? fmt(totalBalance) : "••••••••"}
              </p>
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                monthlyVariation >= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mb-8">
          <div className="bg-background p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Receitas do Mês</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tabular-nums text-foreground">{showBalances ? fmt(totalIncome) : "••••••"}</p>
              <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="bg-background p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Despesas Acumuladas</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tabular-nums text-foreground">{showBalances ? fmt(totalAllExpenses) : "••••••"}</p>
              <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center text-red-500">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-[9px] font-bold uppercase text-muted-foreground">Fixas: {fmt(totalExpense)}</span>
              <span className="text-[9px] font-bold uppercase text-muted-foreground border-l border-border pl-2">Cartão: {fmt(totalCardInvoice)}</span>
            </div>
          </div>

          <div className="bg-background p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Economia Líquida</p>
            <div className="flex items-center justify-between">
              <p className={cn("text-2xl font-bold tabular-nums", savings >= 0 ? "text-foreground" : "text-red-500")}>
                {showBalances ? fmt(savings) : "••••••"}
              </p>
              <span className="text-xs font-bold text-muted-foreground">{savingsRate.toFixed(1)}%</span>
            </div>
            <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                className="h-full bg-foreground rounded-full" 
              />
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Top Expenses */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Distribuição de Gastos</h2>
            </div>

            <div className="bg-background rounded-lg border border-border/50 p-5 space-y-5">
              {topExpenses.length === 0 ? (
                <div className="py-10 text-center opacity-30">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase">Sem dados</p>
                </div>
              ) : (
                topExpenses.map((e) => (
                  <div key={e.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{e.categoryName}</span>
                      <span className="text-xs font-bold tabular-nums text-foreground">{fmt(e.total)}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(e.total / maxExpense) * 100}%` }}
                        className="h-full bg-foreground/60 rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Atividade Recente</h2>
              </div>
              <a href="/transactions" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Ver Tudo
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/50">
              {recentActivity.length === 0 ? (
                <div className="p-10 text-center opacity-30">
                  <p className="text-[10px] font-bold uppercase">Nenhum lançamento</p>
                </div>
              ) : (
                recentActivity.map((t) => (
                  <motion.div
                    key={t.source + t.id}
                    className="flex items-center gap-4 p-4 bg-background hover:bg-secondary/30 transition-colors"
                  >
                    <div className={cn(
                      "h-8 w-8 rounded flex items-center justify-center shrink-0 border border-border/50",
                      t.type === "income" ? "text-emerald-500" : "text-foreground"
                    )}>
                      {t.source === "card" ? <CreditCard className="h-4 w-4" />
                        : t.type === "income" ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate tracking-tight">{t.description}</h3>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        {goals.length > 0 && (
          <section className="mt-12 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Metas em Foco</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
                return (
                  <div key={g.id} className="bg-background rounded-lg border border-border/50 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-foreground text-sm tracking-tight mb-0.5">{g.name}</h4>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">{fmt(Number(g.currentAmount))} / {fmt(Number(g.targetAmount))}</p>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-foreground">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                    
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
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
