"use client";

import { useState, useMemo } from "react";
import { 
  Plus, Edit, Trash2, Target, Calendar, TrendingUp, 
  CheckCircle2, Clock, XCircle, PlusCircle, 
  Wallet, ArrowRight, Info, AlertCircle 
} from "lucide-react";
import { 
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, 
  useAccounts, useGoalDeposit 
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea, FormRow } from "@/components/ui/form-field";
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
  high: { label: "Alta", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  medium: { label: "Média", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  low: { label: "Baixa", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
} as const;

export default function GoalsPage() {
  const { toast } = useToast();
  const { data: goals = [], isLoading } = useGoals();
  const { data: accounts = [] } = useAccounts();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const depositToGoal = useGoalDeposit();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModal, setDepositModal] = useState<string | null>(null);
  const [depositForm, setDepositForm] = useState({ amount: "", accountId: "", date: new Date().toISOString().split("T")[0] });
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
    if (form.goalType === "target" && (!form.targetAmount || Number(form.targetAmount) <= 0)) {
      e.targetAmount = "Valor alvo obrigatório";
    }
    if (!form.startDate) e.startDate = "Início obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      targetAmount: form.goalType === "target" ? Number(form.targetAmount) : null,
      currentAmount: Number(form.currentAmount),
      monthlyContribution: form.monthlyContribution ? Number(form.monthlyContribution) : null,
    };
    try {
      if (editingId) await updateGoal.mutateAsync({ id: editingId, ...payload });
      else await createGoal.mutateAsync(payload);
      toast(editingId ? "Meta atualizada!" : "Meta criada com sucesso!");
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message || "Erro ao salvar meta", "error");
    }
  };

  const handleDeposit = async () => {
    if (!depositForm.amount || !depositForm.accountId || !depositModal) {
      toast("Preencha o valor e selecione a conta", "error");
      return;
    }
    try {
      await depositToGoal.mutateAsync({
        goalId: depositModal,
        accountId: depositForm.accountId,
        amount: Number(depositForm.amount),
        date: depositForm.date,
        description: `Depósito: ${goals.find((g: any) => g.id === depositModal)?.name}`
      });
      toast("Depósito realizado e saldo atualizado!");
      setDepositModal(null);
      setDepositForm({ amount: "", accountId: "", date: new Date().toISOString().split("T")[0] });
    } catch (e: any) {
      toast(e.message || "Erro no depósito", "error");
    }
  };

  const stats = useMemo(() => {
    const active = goals.filter((g: any) => g.status === "active");
    const totalTarget = active.reduce((acc: number, g: any) => acc + Number(g.targetAmount || 0), 0);
    const totalCurrent = goals.reduce((acc: number, g: any) => acc + Number(g.currentAmount || 0), 0);
    return {
      total: goals.length,
      active: active.length,
      totalTarget,
      totalCurrent,
      progress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
    };
  }, [goals]);

  if (isLoading) return <div className="h-96 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suas Metas</h1>
            <p className="text-sm text-slate-500 mt-1">Transforme seus sonhos em realidade.</p>
          </div>
          <Button onClick={openCreate} className="rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm font-medium text-slate-500">Total Guardado</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fmt(stats.totalCurrent)}</h3>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(stats.progress, 100)}%` }} />
              </div>
              <span className="text-xs font-semibold text-emerald-500">{stats.progress.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-sm font-medium text-slate-500">Metas Ativas</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</h3>
              <span className="text-sm text-slate-400">objetivos</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">De um total de {stats.total} metas criadas</p>
          </div>
        </div>
      </div>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g: any) => {
          const current = Number(g.currentAmount);
          const target = Number(g.targetAmount);
          const monthly = Number(g.monthlyContribution || 0);
          const progress = target > 0 ? (current / target) * 100 : 0;
          const remaining = target - current;
          const priority = priorityConfig[g.priority as keyof typeof priorityConfig] || priorityConfig.medium;
          
          // Lógica de Projeção
          const monthsLeft = monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null;
          const estimatedDate = monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)) : null;

          return (
            <div key={g.id} className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{g.name}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", priority.bg, priority.color, priority.border)}>
                        {priority.label}
                      </span>
                      {g.status === "completed" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Concluída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(g)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(g.id)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-black text-slate-900">{fmt(current)}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Alvo: {fmt(target)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", progress >= 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-900")} 
                      style={{ width: `${Math.min(progress, 100)}%` }} 
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>{progress.toFixed(1)}% Completo</span>
                    <span>{remaining > 0 ? `Faltam ${fmt(remaining)}` : "Objetivo Atingido!"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Poupando p/ mês</p>
                    <p className="text-sm font-bold text-slate-900">{monthly > 0 ? fmt(monthly) : "--"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Previsão</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {estimatedDate ? estimatedDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) : "Indefinida"}
                    </p>
                  </div>
                </div>

                {g.status === "active" && (
                  <button 
                    onClick={() => { setDepositModal(g.id); setDepositForm(prev => ({ ...prev, accountId: accounts[0]?.id || "" })); }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-black active:scale-95 shadow-lg shadow-slate-200"
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

      {/* Modal Criar/Editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Meta" : "Nova Meta"} size="md">
        <div className="space-y-6 pt-2">
          <Field label="Como você chama esse objetivo?" required error={errors.name}>
            <Input placeholder="Ex: Viagem para o Japão 🇯🇵" value={form.name} onChange={e => set("name", e.target.value)} />
          </Field>

          <FormRow>
            <Field label="Valor total do objetivo" required error={errors.targetAmount}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" className="pl-9" value={form.targetAmount} onChange={e => set("targetAmount", e.target.value)} />
              </div>
            </Field>
            <Field label="Já tem quanto guardado?">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" className="pl-9" value={form.currentAmount} onChange={e => set("currentAmount", e.target.value)} />
              </div>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Investimento mensal planejado">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" className="pl-9" value={form.monthlyContribution} onChange={e => set("monthlyContribution", e.target.value)} />
              </div>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={e => set("priority", e.target.value)}>
                <option value="low">Baixa (Desejo)</option>
                <option value="medium">Média (Planejamento)</option>
                <option value="high">Alta (Urgência)</option>
              </Select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Data de início" required>
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Em andamento</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Pausada/Cancelada</option>
              </Select>
            </Field>
          </FormRow>

          <Field label="Observações">
            <Textarea placeholder="Qualquer detalhe importante..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Field>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-slate-900 text-white" onClick={save}>Guardar Meta</Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Depósito Integrado */}
      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Adicionar Dinheiro" size="sm">
        <div className="space-y-5 pt-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-800">
              O valor será deduzido do saldo da conta física selecionada e adicionado ao progresso da sua meta.
            </p>
          </div>

          <Field label="Qual o valor?">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
              <Input 
                autoFocus type="number" step="0.01" className="pl-10 text-lg font-bold" 
                value={depositForm.amount} onChange={e => setDepositForm(prev => ({ ...prev, amount: e.target.value }))} 
              />
            </div>
          </Field>

          <Field label="De qual conta deseja retirar?">
            <Select value={depositForm.accountId} onChange={e => setDepositForm(prev => ({ ...prev, accountId: e.target.value }))}>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {fmt(Number(acc.balance))})</option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-col gap-2 pt-4">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-bold shadow-lg shadow-emerald-100" onClick={handleDeposit}>
              Confirmar Depósito
            </Button>
            <Button variant="ghost" className="text-slate-400" onClick={() => setDepositModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Deletar */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Meta?" size="sm">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-900 font-medium">Esta ação não pode ser desfeita. O histórico dessa meta será perdido.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Voltar</Button>
          <Button variant="destructive" className="flex-1" onClick={async () => {
             try {
               await deleteGoal.mutateAsync(deleteId!);
               toast("Meta removida");
               setDeleteId(null);
             } catch { toast("Erro ao deletar", "error"); }
          }}>Confirmar Exclusão</Button>
        </div>
      </Modal>
    </div>
  );
}
