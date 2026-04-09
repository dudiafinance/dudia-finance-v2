"use client";

import { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, AlertTriangle, CheckCircle2,
  Bell, Filter, Zap, TrendingUp
} from "lucide-react";
import {
  useCategories, useBudgetStats,
  useCreateBudget, useUpdateBudget, useDeleteBudget
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow, FormDivider } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

type Budget = {
  id: string;
  name: string;
  categoryId?: string;
  amount: number | string;
  period: string;
  startDate: string;
  endDate?: string;
  alertsEnabled: boolean;
  alertThreshold: number | string;
  spent?: number | string;
};

type Category = {
  id: string;
  name: string;
  type?: string;
  color?: string;
};

type FormData = {
  name: string;
  categoryId: string;
  amount: string;
  period: string;
  startDate: string;
  endDate: string;
  alertsEnabled: boolean;
  alertThreshold: string;
};

const emptyForm = (): FormData => ({
  name: "",
  categoryId: "",
  amount: "",
  period: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  alertsEnabled: true,
  alertThreshold: "80",
});

export default function BudgetsPage() {
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: budgetStats = [], isLoading } = useBudgetStats();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const showBalances = true;

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      categoryId: b.categoryId ?? "",
      amount: String(Number(b.amount)),
      period: b.period,
      startDate: new Date(b.startDate).toISOString().split("T")[0],
      endDate: b.endDate ? new Date(b.endDate).toISOString().split("T")[0] : "",
      alertsEnabled: b.alertsEnabled,
      alertThreshold: String(b.alertThreshold),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Valor inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const formPayload = {
      name: form.name,
      categoryId: form.categoryId || undefined,
      amount: Number(form.amount),
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      alertsEnabled: form.alertsEnabled,
      alertThreshold: Number(form.alertThreshold),
    };
    try {
      if (editingId) await updateBudget.mutateAsync({ id: editingId, ...formPayload });
      else await createBudget.mutateAsync(formPayload);
      toast(editingId ? "Orçamento atualizado!" : "Orçamento criado!");
      setModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBudget.mutateAsync(deleteId);
      toast("Orçamento excluído.", "warning");
      setDeleteId(null);
    } catch {
      toast("Erro ao excluir", "error");
    }
  };

  const stats = useMemo(() => {
    const typedStats = budgetStats as unknown as Budget[];
    const totalBudgeted = typedStats.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent = typedStats.reduce((s, b) => s + Number(b.spent), 0);
    const overBudgetCount = typedStats.filter((b) => Number(b.spent) > Number(b.amount)).length;
    return {
      totalBudgeted,
      totalSpent,
      remaining: Math.max(totalBudgeted - totalSpent, 0),
      overBudgetCount,
      usagePercent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
    };
  }, [budgetStats]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando orçamentos...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Governança de Gastos</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Orçamentos</h1>
          </div>
          <Button onClick={openCreate} className="gap-2 h-8 text-[11px] font-bold uppercase shadow-precision">
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Orçamento</span>
          </Button>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              Total Planejado
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(stats.totalBudgeted) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-red-500" />
                Execução Atual
              </p>
              <span className={cn(
                "text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded border shadow-precision",
                stats.usagePercent > 100 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}>
                {stats.usagePercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(stats.totalSpent) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              Status de Limite
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground uppercase tabular-nums">
                {stats.overBudgetCount > 0 ? "Excedido" : "Nominal"}
              </p>
              {stats.overBudgetCount > 0 && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Budget List */}
        {budgetStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Filter className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum orçamento configurado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(budgetStats as unknown as Budget[]).map((b) => {
              const amount = Number(b.amount);
              const spent = Number(b.spent);
              const pct = Math.min((spent / amount) * 100, 100);
              const isOver = spent > amount;
              const isWarning = !isOver && pct >= Number(b.alertThreshold);
              const cat = (categories as unknown as Category[]).find((c) => c.id === b.categoryId);
              const remaining = Math.max(amount - spent, 0);

              return (
                <motion.div 
                  key={b.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative bg-background rounded-lg border border-border/50 p-6 hover:border-border transition-all duration-300 shadow-precision overflow-hidden"
                  onClick={() => openEdit(b)}
                >
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-10 w-10 rounded flex items-center justify-center border border-border/50 shadow-precision group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: cat ? `${cat.color}20` : 'var(--secondary)' }}
                      >
                        {cat ? (
                          <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.name.charAt(0)}</span>
                        ) : (
                          <Filter className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground tracking-tight">{b.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
                            {b.period}
                          </span>
                          {b.alertsEnabled && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                              <Bell className="h-2.5 w-2.5" /> {b.alertThreshold}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openEdit(b); }} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(b.id); }} 
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className={cn("text-lg font-bold tabular-nums tracking-tight", isOver ? "text-red-500" : "text-foreground")}>
                        {fmt(spent)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Teto: {fmt(amount)}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-foreground"
                        )} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {isOver ? "Limite Excedido" : isWarning ? "Alerta de Teto" : "Consumo Regular"}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {isOver ? `+${fmt(spent - amount)}` : `${fmt(remaining)} disp.`}
                      </span>
                    </div>
                  </div>

                  {/* Backdrop Accent */}
                  {cat && (
                    <div className="absolute top-0 right-0 h-16 w-16 opacity-5 blur-3xl rounded-full -mr-8 -mt-8" style={{ backgroundColor: cat.color }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
