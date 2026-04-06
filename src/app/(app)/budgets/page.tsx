"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle2, TrendingUp, Bell, BellOff } from "lucide-react";
import { useBudgets, useCategories, useTransactions, useCreateBudget, useUpdateBudget, useDeleteBudget } from "@/hooks/use-api";
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
  const { data: budgets = [], isLoading } = useBudgets();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
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

  const getSpent = (categoryId: string | undefined) =>
    transactions
      .filter((t: any) => t.type === "expense" && t.categoryId === categoryId)
      .reduce((s: number, t: any) => s + Number(t.amount), 0);

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
      if (editingId) {
        await updateBudget.mutateAsync({ id: editingId, ...formPayload });
        toast("Orçamento atualizado!");
      } else {
        await createBudget.mutateAsync(formPayload);
        toast("Orçamento criado!");
      }
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
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + getSpent(b.categoryId), 0);
  const overBudget = budgets.filter((b: any) => getSpent(b.categoryId) > Number(b.amount)).length;

  const periodLabel = (p: string) =>
    ({ weekly: "Semanal", monthly: "Mensal", yearly: "Anual" }[p] ?? p);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-sm text-slate-500">{budgets.length} orçamentos ativos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Orçado", value: fmt(totalBudget), sub: "planejado", icon: TrendingUp, color: "blue" },
          { label: "Total Gasto", value: fmt(totalSpent), sub: `${((totalSpent / totalBudget) * 100 || 0).toFixed(1)}% do orçamento`, icon: TrendingUp, color: totalSpent > totalBudget ? "red" : "emerald" },
          { label: "Acima do Limite", value: String(overBudget), sub: overBudget > 0 ? "categorias estouradas" : "tudo ok!", icon: AlertTriangle, color: overBudget > 0 ? "red" : "emerald" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={cn("text-2xl font-bold mt-1",
              color === "blue" ? "text-slate-900" : color === "emerald" ? "text-emerald-600" : "text-red-600"
            )}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Global progress */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Progresso Geral</p>
          <p className="text-sm font-bold text-slate-900">
            {fmt(totalSpent)} / {fmt(totalBudget)}
          </p>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100">
          <div
            className={cn("h-3 rounded-full transition-all", totalSpent > totalBudget ? "bg-red-500" : totalSpent / totalBudget > 0.8 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{((totalSpent / totalBudget) * 100 || 0).toFixed(1)}% utilizado</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b: any) => {
          const amount = Number(b.amount);
          const alertThreshold = Number(b.alertThreshold);
          const spent = getSpent(b.categoryId);
          const pct = Math.min((spent / amount) * 100, 100);
          const isOver = spent > amount;
          const isAlert = !isOver && pct >= alertThreshold;
          const cat = categories.find((c: any) => c.id === b.categoryId);

          return (
            <div key={b.id} className={cn("group rounded-xl bg-white p-5 shadow-sm border transition-all hover:shadow-md",
              isOver ? "border-red-200" : isAlert ? "border-amber-200" : "border-slate-100"
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {cat && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${cat.color}18` }}>
                      <span className="text-base font-bold" style={{ color: cat.color }}>
                        {cat.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{periodLabel(b.period)}</span>
                      {b.alertsEnabled ? (
                        <Bell className="h-3 w-3 text-slate-400" />
                      ) : (
                        <BellOff className="h-3 w-3 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={cn("font-semibold", isOver ? "text-red-600" : "text-slate-800")}>
                    {fmt(spent)}
                  </span>
                  <span className="text-slate-400">de {fmt(amount)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={cn("h-2 rounded-full transition-all",
                      isOver ? "bg-red-500" : isAlert ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{pct.toFixed(1)}% usado</span>
                  {isOver ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Estourado em {fmt(spent - amount)}
                    </span>
                  ) : isAlert ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Atenção: {alertThreshold}% atingido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {fmt(amount - spent)} restante
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Orçamento" : "Novo Orçamento"}
        description="Defina um limite de gastos por categoria" size="md">
        <div className="space-y-4">
          <Field label="Nome" required error={errors.name}>
            <Input placeholder="Ex: Alimentação Mensal" value={form.name}
              onChange={(e) => set("name", e.target.value)} error={!!errors.name} />
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sem categoria</option>
                {categories.filter((c: any) => c.type === "expense").map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Período">
              <Select value={form.period} onChange={(e) => set("period", e.target.value)}>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </Select>
            </Field>
          </FormRow>

          <Field label="Valor Limite" required error={errors.amount}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                value={form.amount} onChange={(e) => set("amount", e.target.value)}
                error={!!errors.amount} className="pl-9" />
            </div>
          </Field>

          <FormRow>
            <Field label="Data início">
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="Data fim (opcional)">
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
          </FormRow>

          <FormDivider label="Alertas" />

          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={form.alertsEnabled} onChange={(e) => set("alertsEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
            <span className="text-sm text-slate-700">Habilitar alertas</span>
          </label>

          {form.alertsEnabled && (
            <Field label={`Alertar ao atingir ${form.alertThreshold}% do limite`}>
              <div className="space-y-2">
                <input type="range" min="50" max="100" step="5" value={form.alertThreshold}
                  onChange={(e) => set("alertThreshold", e.target.value)}
                  className="w-full accent-emerald-600" />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>50%</span><span className="font-medium text-emerald-600">{form.alertThreshold}%</span><span>100%</span>
                </div>
              </div>
            </Field>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Salvar Alterações" : "Criar Orçamento"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Orçamento" size="sm">
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir este orçamento?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
