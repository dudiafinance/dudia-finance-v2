"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Target, Calendar, TrendingUp, CheckCircle2, Clock, XCircle, PlusCircle } from "lucide-react";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea, FormRow, FormDivider } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type FormData = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  priority: string;
  status: string;
  notes: string;
};

const emptyForm = (): FormData => ({
  name: "",
  targetAmount: "",
  currentAmount: "0",
  deadline: "",
  priority: "medium",
  status: "active",
  notes: "",
});

const priorityConfig = {
  high: { label: "Alta", color: "red" },
  medium: { label: "Média", color: "amber" },
  low: { label: "Baixa", color: "blue" },
} as const;

const statusConfig = {
  active: { label: "Ativa", icon: Clock, color: "blue" },
  completed: { label: "Concluída", icon: CheckCircle2, color: "emerald" },
  cancelled: { label: "Cancelada", icon: XCircle, color: "slate" },
} as const;

export default function GoalsPage() {
  const { toast } = useToast();
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModal, setDepositModal] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
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

  const openEdit = (g: any) => {
    setEditingId(g.id);
    setForm({
      name: g.name,
      targetAmount: String(Number(g.targetAmount)),
      currentAmount: String(Number(g.currentAmount)),
      deadline: g.deadline ? new Date(g.deadline).toISOString().split("T")[0] : "",
      priority: g.priority,
      status: g.status,
      notes: g.notes ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.targetAmount || Number(form.targetAmount) <= 0) e.targetAmount = "Valor obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const formPayload = {
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      deadline: form.deadline || undefined,
      priority: form.priority,
      status: form.status,
      notes: form.notes,
    };
    try {
      if (editingId) {
        await updateGoal.mutateAsync({ id: editingId, ...formPayload });
        toast("Meta atualizada!");
      } else {
        await createGoal.mutateAsync(formPayload);
        toast("Meta criada!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGoal.mutateAsync(deleteId);
      toast("Meta excluída.", "warning");
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const addDeposit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0 || !depositModal) return;
    const goal = goals.find((g: any) => g.id === depositModal);
    if (!goal) return;
    const currentAmt = Number(goal.currentAmount);
    const targetAmt = Number(goal.targetAmount);
    const next = currentAmt + amt;
    try {
      await updateGoal.mutateAsync({
        id: depositModal,
        currentAmount: next,
        status: next >= targetAmt ? "completed" : goal.status,
      });
      toast(`Depósito de ${fmt(amt)} registrado!`);
    } catch (e: any) {
      toast(e.message ?? "Erro ao registrar depósito", "error");
    }
    setDepositModal(null);
    setDepositAmount("");
  };

  const active = goals.filter((g: any) => g.status === "active");
  const completed = goals.filter((g: any) => g.status === "completed");
  const totalTarget = goals.reduce((s: number, g: any) => s + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((s: number, g: any) => s + Number(g.currentAmount), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Metas Financeiras</h1>
          <p className="text-sm text-slate-500">{active.length} ativas · {completed.length} concluídas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total de Metas", value: String(goals.length), sub: `${active.length} ativas` },
          { label: "Meta Total", value: fmt(totalTarget), sub: "valor alvo" },
          { label: "Total Guardado", value: fmt(totalSaved), sub: `${((totalSaved / totalTarget) * 100 || 0).toFixed(1)}% atingido` },
          { label: "Faltando", value: fmt(Math.max(totalTarget - totalSaved, 0)), sub: "para atingir todas" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((g: any) => {
          const currentAmount = Number(g.currentAmount);
          const targetAmount = Number(g.targetAmount);
          const pct = Math.min((currentAmount / targetAmount) * 100, 100);
          const remaining = targetAmount - currentAmount;
          const priority = priorityConfig[g.priority as keyof typeof priorityConfig];
          const status = statusConfig[g.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          const today = new Date();
          const deadline = g.deadline ? new Date(g.deadline) : null;
          const daysLeft = deadline
            ? Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            : null;

          return (
            <div key={g.id} className={cn("group rounded-xl bg-white p-5 shadow-sm border transition-all hover:shadow-md",
              g.status === "completed" ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100"
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl",
                    g.status === "completed" ? "bg-emerald-100" : "bg-blue-50"
                  )}>
                    <Target className={cn("h-5 w-5", g.status === "completed" ? "text-emerald-600" : "text-blue-600")} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{g.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium",
                        status.color === "blue" ? "text-blue-600" : status.color === "emerald" ? "text-emerald-600" : "text-slate-400"
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                        priority.color === "red" ? "bg-red-100 text-red-700"
                          : priority.color === "amber" ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {priority.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(g)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(g.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold text-slate-900">{fmt(currentAmount)}</span>
                  <span className="text-sm text-slate-400 self-end">de {fmt(targetAmount)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div
                    className={cn("h-2.5 rounded-full transition-all",
                      g.status === "completed" ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : "bg-slate-400"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{pct.toFixed(1)}%</span>
                  {g.status !== "completed" && remaining > 0 && (
                    <span className="text-slate-400">Faltam {fmt(remaining)}</span>
                  )}
                </div>

                {(daysLeft !== null || g.notes) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2 mt-1">
                    {daysLeft !== null && (
                      <span className={cn("inline-flex items-center gap-1",
                        daysLeft < 30 ? "text-amber-600" : daysLeft < 0 ? "text-red-600" : ""
                      )}>
                        <Calendar className="h-3 w-3" />
                        {daysLeft < 0 ? `Venceu há ${Math.abs(daysLeft)} dias` : `${daysLeft} dias restantes`}
                      </span>
                    )}
                  </div>
                )}

                {g.status === "active" && (
                  <button
                    onClick={() => { setDepositModal(g.id); setDepositAmount(""); }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Depósito
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Meta" : "Nova Meta Financeira"}
        description="Defina seu objetivo financeiro" size="md">
        <div className="space-y-4">
          <Field label="Nome da Meta" required error={errors.name}>
            <Input placeholder="Ex: Reserva de emergência, Viagem Japão..." value={form.name}
              onChange={(e) => set("name", e.target.value)} error={!!errors.name} />
          </Field>

          <FormRow>
            <Field label="Valor Alvo" required error={errors.targetAmount}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.targetAmount} onChange={(e) => set("targetAmount", e.target.value)}
                  error={!!errors.targetAmount} className="pl-9" />
              </div>
            </Field>
            <Field label="Valor Atual">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.currentAmount} onChange={(e) => set("currentAmount", e.target.value)} className="pl-9" />
              </div>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Prazo">
              <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </Select>
            </Field>
          </FormRow>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Ativa</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </Select>
          </Field>

          <Field label="Observações">
            <Textarea placeholder="Notas sobre a meta..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Salvar Alterações" : "Criar Meta"}</Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Adicionar Depósito" size="sm">
        <p className="text-sm text-slate-500 mb-4">
          Quanto deseja adicionar a esta meta?
        </p>
        <Field label="Valor do Depósito" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
            <Input type="number" step="0.01" min="0" placeholder="0,00"
              value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
              className="pl-9" />
          </div>
        </Field>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDepositModal(null)}>Cancelar</Button>
          <Button onClick={addDeposit}>Confirmar Depósito</Button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Meta" size="sm">
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir esta meta?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
