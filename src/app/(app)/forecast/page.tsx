"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Info, CalendarDays, LineChart as ChartIcon } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  startingBalance: number;
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
      <div className="min-h-screen pb-20">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800" />)}
          </div>
          <div className="h-80 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Previsão</h1>
        </div>
        <div className="px-6 py-6">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-700 dark:text-red-300">
            Erro ao carregar previsão de saldo.
          </div>
        </div>
      </div>
    );
  }

  const totalIncome = data.reduce((s, m) => s + m.income, 0);
  const totalExpenses = data.reduce((s, m) => s + m.expenses + m.cardInvoice, 0);
  const bestMonth = data.reduce((best, m) => m.netBalance > best.netBalance ? m : best, data[0] ?? { netBalance: 0, monthName: "-" } as any);
  const worstMonth = data.reduce((worst, m) => m.netBalance < worst.netBalance ? m : worst, data[0] ?? { netBalance: 0, monthName: "-" } as any);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Previsão</h1>
            <p className="text-sm text-slate-500 mt-1">Projeção dos próximos 12 meses.</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Info box */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 px-6 py-4 shadow-sm"
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-0.5">Entenda a Projeção</h4>
            <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
              <span className="font-bold opacity-100">Saldo Final = </span>
              Receitas − Despesas Fixas − Faturas de Cartão − Orçamentos Definidos − Contribuições para Metas
            </p>
          </div>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Saldo Atual", value: fmt(data[0]?.startingBalance ?? 0), color: "text-slate-900 dark:text-white" },
            { 
              label: "Projeção (12m)", 
              value: fmt(data[12]?.cumulativeBalance ?? 0), 
              color: (data[12]?.cumulativeBalance ?? 0) >= (data[0]?.startingBalance ?? 0) ? "text-emerald-600" : "text-red-600" 
            },
            { 
              label: "Melhor Mês", 
              value: fmt(bestMonth?.netBalance ?? 0), 
              color: "text-emerald-600", 
              icon: TrendingUp, 
              iconColor: "text-emerald-500",
              sub: bestMonth?.monthName 
            },
            { 
              label: "Pior Mês", 
              value: fmt(worstMonth?.netBalance ?? 0), 
              color: "text-red-600", 
              icon: TrendingDown, 
              iconColor: "text-red-500",
              sub: worstMonth?.monthName 
            },
          ].map((card, i) => (
            <motion.div 
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon && <card.icon className={cn("h-3.5 w-3.5", card.iconColor)} />}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              </div>
              <p className={cn("text-2xl font-bold tracking-tight", card.color)}>{card.value}</p>
              {card.sub && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase opacity-60">{card.sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ChartIcon className="h-4 w-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Evolução do Saldo</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-slate-500">Saldo Projetado</span>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="monthName" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.split(' ')[0].substring(0, 3)}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => `R$ ${v / 1000}k`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as ForecastMonth;
                      return (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
                          <p className="mb-2 text-xs font-bold text-slate-900 dark:text-white capitalize">{d.monthName}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-8 text-[11px]">
                              <span className="text-slate-500">Saldo Inicial:</span>
                              <span className="font-medium text-slate-900 dark:text-slate-200">{fmt(d.startingBalance)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8 text-[11px]">
                              <span className="text-slate-500">Resultado:</span>
                              <span className={cn("font-medium", d.netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {d.netBalance >= 0 ? "+" : ""}{fmt(d.netBalance)}
                              </span>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-1 flex items-center justify-between gap-8 text-[11px]">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Saldo Final:</span>
                              <span className="font-bold text-blue-600">{fmt(d.cumulativeBalance)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeBalance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  animationDuration={1500}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly cards */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Detalhamento Mensal</h2>
          {data.map((m) => {
            const totalCommitments = m.expenses + m.cardInvoice + m.budgetAllocations + m.goalContributions;
            const incomeWidth = m.income > 0
              ? Math.min(100, (m.income / Math.max(m.income, totalCommitments)) * 100)
              : 0;
            const commitWidth = totalCommitments > 0
              ? Math.min(100, (totalCommitments / Math.max(m.income, totalCommitments)) * 100)
              : 0;

            return (
              <motion.div
                key={`${m.year}-${m.month}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                className={cn(
                  "rounded-2xl bg-white dark:bg-slate-800 border p-6 transition-all cursor-default",
                  m.isCurrent 
                    ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20" 
                    : "border-slate-200 dark:border-slate-700 shadow-sm"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span className={cn("text-sm font-semibold capitalize", m.isCurrent ? "text-blue-600" : "text-slate-900 dark:text-white")}>
                      {m.monthName}
                    </span>
                    {m.isCurrent && (
                      <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        Atual
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={cn("text-base font-bold", m.netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {m.netBalance >= 0 ? "+" : ""}{fmt(m.netBalance)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                      Saldo: {fmt(m.startingBalance)} → {fmt(m.cumulativeBalance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Receitas</p>
                    <p className="font-semibold text-emerald-600">{fmt(m.income)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Despesas</p>
                    <p className="font-semibold text-red-600">{fmt(m.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cartão</p>
                    <p className="font-semibold text-violet-600">{fmt(m.cardInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Orçamentos</p>
                    <p className="font-semibold text-amber-600">{fmt(m.budgetAllocations)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Metas</p>
                    <p className="font-semibold text-blue-600">{fmt(m.goalContributions)}</p>
                  </div>
                </div>

                {/* Bar visual */}
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-center">
                    <span className="w-16 text-[10px] text-slate-400 shrink-0">Receitas</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${incomeWidth}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-16 text-[10px] text-slate-400 shrink-0">Compromissos</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-red-400 rounded-full transition-all" style={{ width: `${commitWidth}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}