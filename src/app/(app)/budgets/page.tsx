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
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

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

  if (isLoading) return <div className="h-96 w-full animate-pulse bg-slate-50/50 rounded-3xl border border-slate-100" />;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Premium */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orçamentos</h1>
          <p className="text-slate-500 mt-1">Controle seus gastos com precisão absoluta.</p>
        </div>
        <Button onClick={openCreate} className="bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200">
          <Plus className="mr-2 h-4 w-4" />
          Novo Limite
        </Button>
      </div>

      {/* Main Stats Card - Glassmorphism */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Total Planejado (Mês)</p>
            <h3 className="text-4xl font-black">{fmt(stats.totalBudgeted)}</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>{budgetStats.length} categorias monitoradas</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Progresso Geral</p>
              <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">
                {stats.usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  stats.usagePercent > 100 ? "bg-red-500" : stats.usagePercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
               Gasto atual: <span className="text-white font-bold">{fmt(stats.totalSpent)}</span>
            </p>
          </div>

          <div className="flex flex-col justify-center rounded-3xl bg-white/5 p-6 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                stats.overBudgetCount > 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
              )}>
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
                <p className="text-sm font-bold">
                  {stats.overBudgetCount > 0 
                    ? `${stats.overBudgetCount} categorias estouradas` 
                    : "Dentro do planejado"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Grid de Orçamentos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgetStats.map((b: any) => {
          const amount = Number(b.amount);
          const spent = Number(b.spent);
          const pct = Math.min((spent / amount) * 100, 100);
          const isOver = spent > amount;
          const isWarning = !isOver && pct >= Number(b.alertThreshold);
          const cat = categories.find((c: any) => c.id === b.categoryId);
          const remaining = Math.max(amount - spent, 0);

          return (
            <div key={b.id} className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-900"
                    style={{ backgroundColor: cat ? `${cat.color}15` : '#f8fafc' }}
                  >
                    {cat ? (
                      <span className="text-xl font-bold" style={{ color: cat.color }}>{cat.name.charAt(0)}</span>
                    ) : (
                      <Filter className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{b.name}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        {b.period === 'monthly' ? 'Mensal' : b.period === 'weekly' ? 'Semanal' : 'Anual'}
                      </span>
                      {b.alertsEnabled && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
                          <Bell className="h-3 w-3" /> {b.alertThreshold}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className={cn("text-2xl font-black", isOver ? "text-red-600" : "text-slate-900")}>
                      {fmt(spent)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Limite: {fmt(amount)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                  <div className="mt-3 flex justify-between">
                    <div className="flex items-center gap-1.5">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 uppercase bg-red-50 px-2 py-1 rounded-lg">
                          <AlertTriangle className="h-3 w-3" /> Estourado
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded-lg">
                          <AlertTriangle className="h-3 w-3" /> Alerta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-3 w-3" /> Seguro
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {isOver ? `Excedido em ${fmt(spent - amount)}` : `${fmt(remaining)} disponíveis`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Período Atual</p>
                      <p className="text-[11px] font-bold text-slate-600">
                        {new Date(b.periodDates.start).toLocaleDateString()} — {new Date(b.periodDates.end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Uso</p>
                    <p className={cn("text-xs font-black", isOver ? "text-red-500" : "text-slate-900")}>
                      {pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar/Editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Limite" : "Novo Orçamento"} size="md">
        <div className="space-y-6 pt-2">
          <Field label="Nome do Orçamento" required error={errors.name}>
            <Input placeholder="Ex: Mercado & Alimentação" value={form.name} onChange={e => set("name", e.target.value)} />
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                <option value="">Todas as Categorias</option>
                {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Recorrência">
              <Select value={form.period} onChange={e => set("period", e.target.value)}>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </Select>
            </Field>
          </FormRow>

          <Field label="Valor Máximo" required error={errors.amount}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">R$</span>
              <Input type="number" step="0.01" className="pl-10 text-lg font-bold" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
          </Field>

          <FormRow>
            <Field label="Data de Início">
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </Field>
            <Field label="Data de Fim (Opcional)">
              <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </Field>
          </FormRow>

          <FormDivider label="Configurações de Alerta" />

          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 border border-slate-100">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors">
                <input 
                  type="checkbox" className="peer sr-only" 
                  checked={form.alertsEnabled} onChange={e => set("alertsEnabled", e.target.checked)} 
                />
                <div className="h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-6 peer-checked:bg-emerald-500 ml-1" />
              </div>
              <span className="text-sm font-bold text-slate-700">Notificar quando o limite estiver acabando</span>
            </label>

            {form.alertsEnabled && (
              <Field label={`Alertar ao atingir ${form.alertThreshold}% do valor total`}>
                <div className="space-y-4 pt-2">
                  <input 
                    type="range" min="50" max="100" step="5" 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" 
                    value={form.alertThreshold} onChange={e => set("alertThreshold", e.target.value)} 
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>50%</span>
                    <span className="text-slate-900 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                      Impacto em {form.alertThreshold}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </Field>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-slate-900 text-white" onClick={save}>Ativar Limite</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Deletar */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Orçamento?" size="sm">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-900 font-medium">Isso removerá apenas o acompanhamento. Suas transações permanecem intactas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Voltar</Button>
          <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Confirmar</Button>
        </div>
      </Modal>
    </div>
  );
}
