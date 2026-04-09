"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Info, CalendarDays, LineChart as ChartIcon } from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["forecast"],
    queryFn: fetchForecast,
  });

  if (isLoading) {
    return (
      <div className="w-full animate-in fade-in duration-500">
        <div className="px-6 py-8 border-b border-border/50">
          <div className="h-4 w-32 bg-secondary animate-pulse rounded mb-2" />
          <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
        </div>
        <div className="px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-background animate-pulse" />)}
          </div>
          <div className="h-80 rounded-lg bg-secondary/30 border border-border/50 animate-pulse shadow-precision" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Projeção Patrimonial</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Previsão 12 Meses</h1>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-secondary/30 rounded-lg border border-border/50 shadow-precision">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cálculo baseado em médias e recorrências</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mb-12 shadow-precision">
          {statCards.map((card, i) => (
            <div 
              key={i} 
              className="bg-background p-6"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{card.label}</p>
              <p className={cn("text-2xl font-bold tabular-nums tracking-tight", card.color || "text-foreground")}>
                {card.value}
              </p>
              {card.sub && <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter opacity-60">{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="bg-background rounded-lg border border-border/50 p-8 mb-12 shadow-precision">
          <div className="flex items-center gap-3 mb-8">
            <ChartIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Evolução do Saldo Projetado</h3>
          </div>
          
          <div className="h-[400px] w-full tabular-nums">
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
                              <span className="text-slate-500">{d.isCurrent ? "Saldo Atual:" : "Saldo Inicial:"}</span>
                              <span className="font-medium text-slate-900 dark:text-slate-200">{fmt(d.startingBalance)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8 text-[11px]">
                              <span className="text-slate-500">{d.isCurrent ? "Próx. Entradas/Saídas:" : "Resultado:"}</span>
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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Detalhamento Mensal</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-lg bg-background border p-6 transition-all shadow-precision",
                    m.isCurrent 
                      ? "border-foreground/20 ring-1 ring-foreground/10 bg-secondary/20" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={cn("text-xs font-bold uppercase tracking-widest", m.isCurrent ? "text-foreground" : "text-muted-foreground")}>
                        {m.monthName}
                      </span>
                    </div>
                    {m.isCurrent && (
                      <span className="text-[8px] font-bold uppercase tracking-widest bg-foreground text-background px-2 py-0.5 rounded">
                        Ciclo Atual
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Resultado Projetado</p>
                      <p className={cn("text-sm font-bold tabular-nums", m.netBalance >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {m.netBalance >= 0 ? "+" : ""}{fmt(m.netBalance)}
                      </p>
                    </div>
                    <div className="h-px bg-border/30" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Entradas</p>
                        <p className="text-[11px] font-bold text-foreground tabular-nums">{fmt(m.income)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Compromissos</p>
                        <p className="text-[11px] font-bold text-foreground tabular-nums">{fmt(totalCommitments)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bars visual */}
                  <div className="space-y-2">
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${incomeWidth}%` }} />
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                      <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${commitWidth}%` }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}