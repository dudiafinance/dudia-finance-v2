"use client";

import { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, CheckCircle2,
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
import { useUser } from "@clerk/nextjs";

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
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
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
      startDate: b.startDate ? new Date(b.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
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
      period: form.period as any,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      alertsEnabled: form.alertsEnabled,
      alertThreshold: Number(form.alertThreshold),
    };
    try {
      if (editingId) await updateBudget.mutateAsync({ id: editingId, ...formPayload } as any);
      else await createBudget.mutateAsync(formPayload as any);
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
                <TrendingUp className="h-3 w-3 text-error" />
                Execução Atual
              </p>
              <span className={cn(
                "text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded border shadow-precision",
                stats.usagePercent > 100 ? "bg-error-subtle text-error border-error-subtle" : "bg-success-subtle text-success border-success-subtle"
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
              <Zap className="h-3 w-3 text-warning" />
              Status de Limite
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground uppercase tabular-nums">
                {stats.overBudgetCount > 0 ? "Excedido" : "Nominal"}
              </p>
              {stats.overBudgetCount > 0 && <div className="h-2 w-2 rounded-full bg-error animate-pulse" />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
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
                            <span className="flex items-center gap-1 text-[8px] font-bold text-warning uppercase tracking-widest">
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
                        className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error-subtle"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className={cn("text-lg font-bold tabular-nums tracking-tight", isOver ? "text-error" : "text-foreground")}>
                        {fmt(spent)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Teto: {fmt(amount)}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          isOver ? "bg-error" : isWarning ? "bg-warning" : "bg-foreground"
                        )} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        isOver ? "text-error" : isWarning ? "text-warning" : "text-muted-foreground"
                      )}>
                        {isOver ? "Limite Excedido" : isWarning ? "Alerta de Teto" : "Consumo Regular"}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {isOver ? `+${fmt(spent - amount)}` : `${fmt(remaining)} disp.`}
                      </span>
                    </div>
                  </div>

                  {cat && (
                    <div className="absolute top-0 right-0 h-16 w-16 opacity-5 blur-3xl rounded-full -mr-8 -mt-8" style={{ backgroundColor: cat.color }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Orçamento" : "Novo Orçamento"} size="md">
        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <Field label="Nome do Orçamento" required error={errors.name}>
                <Input placeholder="Ex: Mercado & Alimentação" value={form.name} onChange={e => set("name", e.target.value)} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>

              <Field label="Teto de Gasto" required error={errors.amount}>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" value={form.amount} onChange={e => set("amount", e.target.value)} />
                </div>
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Categoria Vinculada">
                <SearchableSelect 
                  options={(categories as unknown as Category[]).filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                  value={form.categoryId}
                  onChange={val => set("categoryId", val)}
                  placeholder="Todas as Categorias"
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </Field>

              <Field label="Recorrência do Limite">
                <Select value={form.period} onChange={e => set("period", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground uppercase font-bold tracking-widest">
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Vigência (Início)">
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} 
                className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>
            <Field label="Vigência (Fim - Opcional)">
              <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} 
                className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>
          </div>

          <FormDivider label="Protocolo de Alerta" />

          <div className="p-6 rounded-lg bg-secondary/30 border border-border shadow-precision space-y-6">
            <label className="flex cursor-pointer items-center gap-4 group">
              <input 
                type="checkbox" 
                checked={form.alertsEnabled} onChange={e => set("alertsEnabled", e.target.checked)} 
                className="w-4 h-4 rounded border-zinc-700 text-foreground focus:ring-zinc-500" 
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">Habilitar Notificações Proativas</span>
            </label>

            {form.alertsEnabled && (
              <div className="pl-8 space-y-4 animate-in slide-in-from-left-2 duration-300">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Limite de Gatilho: {form.alertThreshold}%</label>
                </div>
                <input 
                  type="range" min="50" max="100" step="5" 
                  className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-foreground" 
                  value={form.alertThreshold} onChange={e => set("alertThreshold", e.target.value)} 
                />
                <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                  <span>Mínimo (50%)</span>
                  <span>Crítico (100%)</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={save} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
              {editingId ? "Salvar Alterações" : "Efetivar Orçamento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Orçamento" size="sm">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-error-subtle flex items-center justify-center text-error border border-error-subtle">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Remover Governança?</h3>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">As transações não serão afetadas, mas o monitoramento deste teto de gastos será interrompido.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Voltar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
