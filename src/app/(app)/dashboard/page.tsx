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
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Consolidando dados financeiros...</p>
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

  // Total de despesas somando contas + fatura do cartão
  const totalAllExpenses = totalExpense + totalCardInvoice;
  const savings = totalIncome - totalAllExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Imersivo com Navegação */}
      <div className="relative overflow-hidden pt-12 pb-32 px-8 mb-[-80px]">
        {/* Background Mesh Gradient */}
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 opacity-90" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-2 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Dashboard</h1>
            </div>
            
            {/* Period Selector Premium */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-[28px] backdrop-blur-xl w-fit">
              <button
                onClick={() => navigateMonth(-1)}
                className="h-11 w-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <button
                onClick={goToCurrentMonth}
                className={cn(
                  "px-6 h-11 rounded-[22px] text-sm font-black uppercase tracking-widest transition-all",
                  isCurrentMonth
                    ? "bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {MONTH_NAMES[month - 1]} {year}
              </button>

              <button
                onClick={() => navigateMonth(1)}
                className="h-11 w-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowBalances(!showBalances)}
            className="group h-16 px-8 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/10 group-hover:bg-white/20 transition-all">
              {showBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </div>
            <span className="font-black text-sm uppercase tracking-[0.15em]">{showBalances ? "Ocultar" : "Mostrar"} Patrimônio</span>
          </button>
        </div>

        {/* Patrimônio Líquido - Centro das Atenções */}
        <div className="relative z-10 mt-16 max-w-[1200px]">
           <div className="flex flex-col md:flex-row md:items-end gap-12">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-emerald-400/80 mb-2">
                    <Crown className="h-5 w-5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Patrimônio Consolidado</span>
                 </div>
                 <p className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums leading-[0.9]">
                   {showBalances ? fmt(totalBalance) : "••••••••"}
                 </p>
                 <div className="flex items-center gap-4 pt-4">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm backdrop-blur-md",
                      monthlyVariation >= 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}>
                       {monthlyVariation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                       <span>{Math.abs(monthlyVariation).toFixed(1)}%</span>
                    </div>
                    <span className="text-slate-400 text-sm font-medium">variação em relação ao mês anterior</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-8 pb-32">
        {/* Row 2: Cashflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <motion.div whileHover={{ y: -5 }} className="glass-card p-10 rounded-[48px] border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-emerald-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-all duration-700" />
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-14 w-14 rounded-[22px] bg-emerald-500/20 flex items-center justify-center text-emerald-400 ring-1 ring-emerald-500/40">
                    <ArrowUpRight className="h-7 w-7" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0.5">Receitas</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-tighter">{showBalances ? fmt(totalIncome) : "••••••"}</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Performance</span>
                    <span className="text-slate-300">Mensal</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                 </div>
              </div>
           </motion.div>

           <motion.div whileHover={{ y: -5 }} className="glass-card p-10 rounded-[48px] border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-red-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-all duration-700" />
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-14 w-14 rounded-[22px] bg-red-500/20 flex items-center justify-center text-red-400 ring-1 ring-red-500/40">
                    <ArrowDownRight className="h-7 w-7" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0.5">Despesas</p>
                    <p className="text-3xl font-black text-red-400 tracking-tighter">{showBalances ? fmt(totalAllExpenses) : "••••••"}</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fixas: {fmt(totalExpense)}</span>
                 <span className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[10px] font-black text-violet-400 uppercase tracking-widest">Cartão: {fmt(totalCardInvoice)}</span>
              </div>
           </motion.div>

           <motion.div whileHover={{ y: -5 }} className="glass-card p-10 rounded-[48px] border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-blue-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-all duration-700" />
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-14 w-14 rounded-[22px] bg-blue-500/20 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/40">
                    <DollarSign className="h-7 w-7" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0.5">Economia Líquida</p>
                    <p className={cn("text-3xl font-black tracking-tighter", savings >= 0 ? "text-blue-400" : "text-red-400")}>
                      {showBalances ? fmt(savings) : "••••••"}
                    </p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Taxa de Poupança</span>
                    <span className="text-slate-300">{Math.max(0, savingsRate).toFixed(1)}%</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    />
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Row 3: Insights Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Top Expenses */}
           <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <PieChart className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Análise de Gastos</h2>
                 </div>
              </div>

              <div className="glass-card p-8 rounded-[40px] bg-white/60 border-white/60 backdrop-blur-xl shadow-xl space-y-8">
                 {topExpenses.length === 0 ? (
                   <div className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sem despesas categorizadas</p>
                   </div>
                 ) : (
                   topExpenses.map((e: any) => (
                     <div key={e.categoryId} className="space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: e.categoryColor, color: e.categoryColor }} />
                              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{e.categoryName}</span>
                           </div>
                           <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(e.total)}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-50">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${(e.total / maxExpense) * 100}%` }}
                             className="h-full rounded-full shadow-[0_0_15px_currentColor]"
                             style={{ backgroundColor: e.categoryColor, color: e.categoryColor }}
                           />
                        </div>
                     </div>
                   ))
                 )}
                 <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <MoreHorizontal className="h-4 w-4" /> Expandir Análise
                 </button>
              </div>
           </div>

           {/* Recent Activity style "Receipt" */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Lançamentos Recentes</h2>
                 </div>
                 <a href="/transactions" className="h-10 px-6 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    Ver Extrato Completo
                    <ArrowRight className="h-4 w-4" />
                 </a>
              </div>

              <div className="space-y-4">
                 {recentActivity.length === 0 ? (
                   <div className="glass-card p-12 rounded-[40px] bg-white border-white text-center">
                      <Receipt className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Histórico vazio neste mês</p>
                   </div>
                 ) : (
                   recentActivity.map((t: any) => (
                     <motion.div
                       key={t.source + t.id}
                       whileHover={{ x: 10 }}
                       className="group flex items-center gap-6 p-6 rounded-[32px] bg-white hover:bg-slate-50 border border-slate-100 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.02)] relative overflow-hidden"
                     >
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full transition-all",
                          t.type === "income" ? "bg-emerald-500" : "bg-red-500"
                        )} />

                        <div className={cn(
                          "h-14 w-14 rounded-[22px] flex items-center justify-center shadow-sm shrink-0",
                          t.type === "income" ? "bg-emerald-50" : "bg-red-50"
                        )}>
                           {t.source === "card" ? <CreditCard className="h-7 w-7 text-violet-600" />
                             : t.type === "income" ? <ArrowUpRight className="h-7 w-7 text-emerald-500" />
                             : <ArrowDownRight className="h-7 w-7 text-red-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-black text-slate-900 truncate tracking-tight">{t.description}</h3>
                              <span className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                t.source === "card" ? "bg-violet-50 text-violet-600 border border-violet-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                              )}>
                                 {t.source === "card" ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
                                 {t.source === "card" ? "Crédito" : "Corrente"}
                              </span>
                           </div>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                              {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                           </p>
                        </div>

                        <div className="text-right">
                           <p className={cn(
                             "text-xl font-black tabular-nums tracking-tighter",
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

        {/* Metas Row 4 */}
        {goals.length > 0 && (
           <section className="mt-16 space-y-8">
              <div className="flex items-center gap-3">
                 <Target className="h-6 w-6 text-emerald-500" />
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Metas em Foco</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.slice(0, 3).map((g: any) => {
                  const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
                  return (
                    <motion.div key={g.id} whileHover={{ scale: 1.02 }} className="glass-card p-8 rounded-[40px] bg-white border-white shadow-xl space-y-6">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="font-black text-slate-900 tracking-tight uppercase text-sm mb-1">{g.name}</h4>
                             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{fmt(Number(g.currentAmount))} de {fmt(Number(g.targetAmount))}</p>
                          </div>
                          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-black text-sm">
                             {pct.toFixed(0)}%
                          </div>
                       </div>
                       
                       <div className="relative h-4 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          />
                       </div>

                       <div className="flex justify-between pt-2">
                          <div className="flex items-center gap-2 text-indigo-500">
                             <Zap className="h-4 w-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Foco total</span>
                          </div>
                          <button className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">Detalhes</button>
                       </div>
                    </motion.div>
                  );
                })}
              </div>
           </section>
        )}
      </div>
    </div>
  );
}
