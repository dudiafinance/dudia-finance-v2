"use client";

import { useState, useMemo } from "react";
import { 
  Plus, Edit, Trash2, AlertTriangle, CheckCircle2, 
  TrendingUp, Bell, BellOff, Calendar, ArrowUpRight,
  Filter, Info, ShieldCheck, Zap
} from "lucide-react";
import { 
  useBudgets, useCategories, useBudgetStats, 
  useCreateBudget, useUpdateBudget, useDeleteBudget 
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow, FormDivider } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

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

  const set = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
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
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar", "error");
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
    const totalBudgeted = budgetStats.reduce((s: number, b: any) => s + Number(b.amount), 0);
    const totalSpent = budgetStats.reduce((s: number, b: any) => s + Number(b.spent), 0);
    const overBudgetCount = budgetStats.filter((b: any) => Number(b.spent) > Number(b.amount)).length;
    return {
      totalBudgeted,
      totalSpent,
      remaining: Math.max(totalBudgeted - totalSpent, 0),
      overBudgetCount,
      usagePercent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
    };
  }, [budgetStats]);

  if (isLoading) return <div className="h-96 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orçamentos</h1>
            <p className="text-sm text-slate-500 mt-1">Controle seus gastos por categoria.</p>
          </div>
          <Button onClick={openCreate} className="font-bold shadow-lg shadow-blue-500/20">
            <Plus className="mr-2 h-5 w-5" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Planejado</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{fmt(stats.totalBudgeted)}</h3>
            <p className="text-xs text-slate-400 mt-1">{budgetStats.length} categorias monitoradas</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gasto Atual</p>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded",
                stats.usagePercent > 100 ? "bg-red-100 text-red-600" : stats.usagePercent > 80 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {stats.usagePercent.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(stats.totalSpent)}</h3>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 mt-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  stats.usagePercent > 100 ? "bg-red-500" : stats.usagePercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                stats.overBudgetCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
              )}>
                <Zap className={cn("h-5 w-5", stats.overBudgetCount > 0 ? "text-red-600" : "text-emerald-600")} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {stats.overBudgetCount > 0 
                    ? `${stats.overBudgetCount} estourados` 
                    : "Dentro do planejado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget List */}
        {budgetStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum orçamento criado</h3>
            <p className="text-sm text-slate-500 mt-1">Crie orçamentos para controlar seus gastos.</p>
            <Button onClick={openCreate} className="mt-6 font-bold shadow-lg px-8">
              <Plus className="mr-2 h-5 w-5" />
              Criar Orçamento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetStats.map((b: any) => {
              const amount = Number(b.amount);
              const spent = Number(b.spent);
              const pct = Math.min((spent / amount) * 100, 100);
              const isOver = spent > amount;
              const isWarning = !isOver && pct >= Number(b.alertThreshold);
              const cat = categories.find((c: any) => c.id === b.categoryId);
              const remaining = Math.max(amount - spent, 0);

              return (
                <motion.div 
                  key={b.id} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: cat ? `${cat.color}20` : '#f1f5f9' }}
                      >
                        {cat ? (
                          <span className="text-lg font-bold" style={{ color: cat.color }}>{cat.name.charAt(0)}</span>
                        ) : (
                          <Filter className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{b.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            {b.period === 'monthly' ? 'Mensal' : b.period === 'weekly' ? 'Semanal' : 'Anual'}
                          </span>
                          {b.alertsEnabled && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500">
                              <Bell className="h-3 w-3" /> {b.alertThreshold}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(b)} 
                        className="h-8 w-8 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-blue-600 shadow-none border-none"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => setDeleteId(b.id)} 
                        className="h-8 w-8 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-red-500 shadow-none border-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className={cn("text-xl font-bold", isOver ? "text-red-600" : "text-slate-900 dark:text-white")}>
                        {fmt(spent)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">de {fmt(amount)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        )} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                        isOver ? "bg-red-100 text-red-600" : isWarning ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {isOver ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {isOver ? "Estourado" : isWarning ? "Alerta" : "Ok"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {isOver ? `+${fmt(spent - amount)}` : `${fmt(remaining)} restantes`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Orçamento" : "Novo Orçamento"} size="md">
        <div className="space-y-4 pt-2">
          <Field label="Nome do Orçamento" required error={errors.name}>
            <Input placeholder="Ex: Mercado & Alimentação" value={form.name} onChange={e => set("name", e.target.value)} className="rounded-md" />
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className="rounded-md">
                <option value="">Todas as Categorias</option>
                {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Recorrência">
              <Select value={form.period} onChange={e => set("period", e.target.value)} className="rounded-md">
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </Select>
            </Field>
          </FormRow>

          <Field label="Valor Máximo" required error={errors.amount}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
              <Input type="number" step="0.01" className="pl-10 h-11 rounded-md" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
          </Field>

          <FormRow>
            <Field label="Data de Início">
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="rounded-md" />
            </Field>
            <Field label="Data de Fim (Opcional)">
              <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className="rounded-md" />
            </Field>
          </FormRow>

          <FormDivider label="Alertas" />

          <div className="space-y-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
            <label className="flex cursor-pointer items-center gap-3">
              <input 
                type="checkbox" 
                checked={form.alertsEnabled} onChange={e => set("alertsEnabled", e.target.checked)} 
                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500" 
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificar quando limite estiver acabando</span>
            </label>

            {form.alertsEnabled && (
              <div className="pl-8 space-y-2">
                <label className="text-xs font-medium text-slate-500">Alertar ao atingir {form.alertThreshold}%</label>
                <input 
                  type="range" min="50" max="100" step="5" 
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                  value={form.alertThreshold} onChange={e => set("alertThreshold", e.target.value)} 
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>50%</span>
                  <span className="font-semibold text-blue-600">{form.alertThreshold}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-[2] font-bold shadow-lg" onClick={save}>{editingId ? "Salvar Alterações" : "Criar Orçamento"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Orçamento?" size="sm">
        <div className="text-center py-4">
          <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">As transações não serão afetadas.</p>
        </div>
        <div className="flex gap-4 mt-6">
          <Button variant="outline" className="flex-1 font-bold" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" className="flex-1 font-bold shadow-lg shadow-red-500/20" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
