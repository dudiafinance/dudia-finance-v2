"use client";

import { useState } from "react";
import { 
  TrendingUp, TrendingDown, BarChart3, Download, 
  ArrowRight, ArrowUpRight, ArrowDownRight, CreditCard, Clock 
} from "lucide-react";
import { useReports } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

export default function ReportsPage() {
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { data, isLoading } = useReports(period);

  const handleExport = () => {
    if (!data) return;
    const { summary: stats, categories, history } = data;

    const rows: string[] = ["Secao,Categoria,Receitas,Despesas,Saldo"];
    rows.push(`Resumo,Total,,${stats.income},${stats.expense},${stats.net}`);

    for (const c of categories.income) {
      rows.push(`Receitas por Categoria,${c.name},${c.value},,`);
    }
    for (const c of categories.expense) {
      rows.push(`Despesas por Categoria,${c.name},,${c.value},`);
    }
    for (const h of history) {
      rows.push(`Historico,${h.month},${h.income},${h.expense},`);
    }

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dudia-finance-relatorio-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Processando dados...</p>
      </div>
    );
  }

  const { summary: stats, categories, history } = data;
  const incomeByCat = categories.income;
  const expenseByCat = categories.expense;
  const maxVal = Math.max(...history.map((h) => Math.max(h.income, h.expense)), 1);

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Consolidação Operacional</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Relatórios</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1 p-1 bg-secondary rounded-lg border border-border shadow-precision">
              {(["week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                    period === p 
                      ? "bg-background text-foreground shadow-precision border-precision border-border/50" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
                </button>
              ))}
            </div>

            <Button onClick={handleExport} className="h-9 px-6 text-[11px] font-bold uppercase shadow-precision">
              <Download className="mr-2 h-3.5 w-3.5" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          {[
            { label: "Total Receitas", value: fmt(stats.income), icon: TrendingUp, color: "text-success" },
            { label: "Total Despesas", value: fmt(stats.expense), icon: TrendingDown, color: "text-error" },
            { label: "Saldo Líquido", value: fmt(stats.net), icon: BarChart3, color: stats.net >= 0 ? "text-foreground" : "text-error" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div 
               key={label}
               className="bg-background p-6"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Icon className="h-3 w-3" />
                {label}
              </p>
              <p className={cn("text-2xl font-bold tabular-nums tracking-tight", color)}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-8 space-y-12">
        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Income by Category */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-success" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Receitas por Categoria</h2>
            </div>
            
            <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
              {incomeByCat.length === 0 ? (
                <div className="py-12 text-center opacity-30">
                  <p className="text-[10px] font-bold uppercase">Sem registros</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {incomeByCat.map(({ name, value }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{name}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums">{fmt(value)}</span>
                      </div>
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.income > 0 ? (value / stats.income) * 100 : 0}%` }}
                          className="h-full rounded-full bg-success/60"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense by Category */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-4 w-4 text-error" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Despesas por Categoria</h2>
            </div>
            
            <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
              {expenseByCat.length === 0 ? (
                <div className="py-12 text-center opacity-30">
                  <p className="text-[10px] font-bold uppercase">Sem registros</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {expenseByCat.map(({ name, value, color }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{name}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums">{fmt(value)}</span>
                      </div>
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.expense > 0 ? (value / stats.expense) * 100 : 0}%` }}
                          className="h-full rounded-full opacity-60"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Chart */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Série Temporal (Fluxo de Caixa)</h2>
          </div>

          <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
            <div className="relative h-64 flex items-end justify-between gap-6 px-4">
              {history.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 min-w-[60px] group">
                  <div className="flex items-end justify-center gap-1.5 h-48 relative w-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.income / maxVal) * 100}%` }}
                      className="w-full max-w-[20px] rounded-t bg-success-subtle border-t border-x border-success-subtle transition-all group-hover:bg-success/40"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.expense / maxVal) * 100}%` }}
                      className="w-full max-w-[20px] rounded-t bg-error-subtle border-t border-x border-error-subtle transition-all group-hover:bg-error/40"
                    />
                  </div>
                  <span className="mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.month}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-10 flex justify-center gap-8 border-t border-border/50 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-error" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Despesas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="bg-secondary/30 rounded-lg border border-border/50 p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-precision">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Análise de Dados Avançada</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Utilize nosso motor de projeção para identificar padrões de consumo e otimização fiscal.</p>
          </div>
          <Button 
            asChild
            variant="outline"
            className="h-10 px-8 text-[10px] font-bold uppercase tracking-widest border-border shadow-precision"
          >
            <a href="/forecast">Simular Cenários Futuristas</a>
          </Button>
        </div>
      </div>
    </div>
  );
}