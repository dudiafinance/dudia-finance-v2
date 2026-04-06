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
  goalType: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  endDate: string;
  monthlyContribution: string;
  priority: string;
  status: string;
  notes: string;
};

const emptyForm = (): FormData => ({
  name: "",
  goalType: "target",
  targetAmount: "",
  currentAmount: "0",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  monthlyContribution: "",
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
      goalType: g.goalType || "target",
      targetAmount: g.targetAmount ? String(Number(g.targetAmount)) : "",
      currentAmount: String(Number(g.currentAmount)),
      startDate: g.startDate ? new Date(g.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: g.endDate ? new Date(g.endDate).toISOString().split("T")[0] : "",
      monthlyContribution: g.monthlyContribution ? String(Number(g.monthlyContribution)) : "",
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
    
    if (form.goalType === "target") {
      if (!form.targetAmount || Number(form.targetAmount) <= 0) {
        e.targetAmount = "Valor alvo obrigatório para meta com valor total";
      }
    } else if (form.goalType === "monthly") {
      if (!form.monthlyContribution || Number(form.monthlyContribution) <= 0) {
        e.monthlyContribution = "Valor mensal obrigatório para meta mensal";
      }
    }
    
    if (!form.startDate) e.startDate = "Data de início obrigatória";
    if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      e.endDate = "Data final deve ser posterior à data de início";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    
    const formPayload: any = {
      name: form.name,
      goalType: form.goalType,
      currentAmount: Number(form.currentAmount),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      priority: form.priority,
      status: form.status,
      notes: form.notes,
    };
    
    if (form.goalType === "target") {
      formPayload.targetAmount = Number(form.targetAmount);
      formPayload.monthlyContribution = form.monthlyContribution ? Number(form.monthlyContribution) : undefined;
    } else if (form.goalType === "monthly") {
      formPayload.targetAmount = undefined;
      formPayload.monthlyContribution = Number(form.monthlyContribution);
    }
    
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          const startDate = g.startDate ? new Date(g.startDate) : null;
          const endDate = g.endDate ? new Date(g.endDate) : null;
          
          const daysFromStart = startDate
            ? Math.ceil((today.getTime() - startDate.getTime()) / 86400000)
            : null;
          const daysToEnd = endDate
            ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000)
            : null;

          const isActive = startDate ? today >= startDate : true;
          
          let expectedContribution = 0;
          let monthsElapsed = 0;
          
          if (startDate && g.monthlyContribution && isActive) {
            const start = new Date(startDate);
            const now = new Date(today);
            
            monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
            
            if (monthsElapsed < 0) monthsElapsed = 0;
            
            expectedContribution = monthsElapsed * Number(g.monthlyContribution);
          }
          
          if (endDate && g.monthlyContribution && g.goalType === 'monthly') {
            const start = new Date(startDate || g.createdAt);
            const end = new Date(endDate);
            const totalMonths = Math.ceil((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
            
            if (totalMonths > 0) {
              const totalExpected = totalMonths * Number(g.monthlyContribution);
            }
          }

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
                {g.goalType === 'target' && g.targetAmount && (
                  <>
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
                  </>
                )}

                {g.goalType === 'monthly' && g.monthlyContribution && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{fmt(Number(g.monthlyContribution))}</span>
                      <span className="text-sm text-slate-400">por mês</span>
                    </div>
                    
                    {!isActive && startDate && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Meta começa em {new Date(startDate).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    
                    {isActive && currentAmount > 0 && (
                      <div className="text-xs text-slate-500">
                        Total guardado: <span className="font-medium text-slate-700">{fmt(currentAmount)}</span>
                        {monthsElapsed > 0 && expectedContribution > 0 && (
                          <span className="text-slate-400 ml-2">
                            (esperado: {fmt(expectedContribution)})
                          </span>
                        )}
                        {monthsElapsed > 0 && (
                          <span className="text-blue-600 ml-2">• {monthsElapsed} {monthsElapsed === 1 ? 'mês' : 'meses'}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-600 font-medium">
                      {endDate ? "Meta com prazo definido" : "Meta mensal contínua"}
                    </div>
                  </>
                )}

                {(startDate || endDate || g.monthlyContribution) && isActive && (
                  <div className="flex flex-col gap-1 text-xs text-slate-400 border-t border-slate-100 pt-2 mt-1">
                    {startDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Início: {new Date(startDate).toLocaleDateString("pt-BR")}
                        {daysFromStart !== null && daysFromStart > 0 && (
                          <span className="text-slate-500 ml-1">({daysFromStart} dias)</span>
                        )}
                        {daysFromStart !== null && daysFromStart < 0 && (
                          <span className="text-amber-600 ml-1">(começa em {Math.abs(daysFromStart)} dias)</span>
                        )}
                      </span>
                    )}
                    {endDate ? (
                      <span className={cn("inline-flex items-center gap-1",
                        daysToEnd !== null && daysToEnd < 30 ? "text-amber-600" : daysToEnd !== null && daysToEnd < 0 ? "text-red-600" : ""
                      )}>
                        <Calendar className="h-3 w-3" />
                        Fim: {new Date(endDate).toLocaleDateString("pt-BR")}
                        {daysToEnd !== null && (
                          <span className="ml-1">
                            {daysToEnd < 0 ? `(${Math.abs(daysToEnd)} dias atrás)` : `(${daysToEnd} dias restantes)`}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Calendar className="h-3 w-3" />
                        Repete indefinidamente
                      </span>
                    )}
                    {g.monthlyContribution && Number(g.monthlyContribution) > 0 && isActive && (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <TrendingUp className="h-3 w-3" />
                        {fmt(Number(g.monthlyContribution))}/mês
                      </span>
                    )}
                  </div>
                )}

                {!isActive && startDate && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Esta meta ainda não começou
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Início: {new Date(startDate).toLocaleDateString("pt-BR")}
                    </p>
                    {g.monthlyContribution && (
                      <p className="text-xs text-amber-600">
                        Valor: {fmt(Number(g.monthlyContribution))}/mês
                      </p>
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

          <Field label="Tipo de Meta">
            <Select value={form.goalType} onChange={(e) => set("goalType", e.target.value)}>
              <option value="target">Com Valor Total (ex: viagem, carro)</option>
              <option value="monthly">Apenas Mensal (ex: guardar R$800/mês)</option>
            </Select>
          </Field>

          {form.goalType === "target" && (
            <>
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
            </>
          )}

          {form.goalType === "monthly" && (
            <>
              <Field label="Valor Mensal" required error={errors.monthlyContribution}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                  <Input type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.monthlyContribution} onChange={(e) => set("monthlyContribution", e.target.value)}
                    error={!!errors.monthlyContribution} className="pl-9" />
                </div>
              </Field>
              <p className="text-xs text-slate-500 -mt-2">
                Este valor será guardado todos os meses. Se definir uma data final, o valor total será calculado automaticamente.
              </p>
            </>
          )}

          <FormRow>
            <Field label="Data de Início" required error={errors.startDate}>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} error={!!errors.startDate} />
            </Field>
            <Field label="Data Final (opcional)" error={errors.endDate}>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} error={!!errors.endDate} />
            </Field>
          </FormRow>

          {form.goalType === "monthly" && !form.endDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <Calendar className="inline h-4 w-4 mr-1" />
                Meta mensal sem data final: continuará indefinidamente até você definir uma data de término.
              </p>
            </div>
          )}

          <FormRow>
            <Field label="Valor Mensal (opcional)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.monthlyContribution} onChange={(e) => set("monthlyContribution", e.target.value)} className="pl-9" />
              </div>
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
