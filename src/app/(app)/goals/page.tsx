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
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Metas</h1>
            <p className="text-sm text-slate-500 mt-1">Acompanhe seus objetivos financeiros.</p>
          </div>
          <Button onClick={openCreate} className="font-bold shadow-lg shadow-blue-500/20 px-8">
            <Plus className="mr-2 h-5 w-5" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Guardado</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{fmt(stats.totalCurrent)}</h3>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(stats.progress, 100)}%` }} />
              </div>
              <span className="text-xs font-semibold text-emerald-500">{stats.progress.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Metas Ativas</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</h3>
              <span className="text-sm text-slate-400">de {stats.total}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Alvo</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{fmt(stats.totalTarget)}</h3>
            <p className="text-xs text-slate-400 mt-1">Planejado total</p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="px-6">
          <div className="flex flex-col items-center justify-center p-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhuma meta criada</h3>
            <p className="text-sm text-slate-500 mt-1">Defina objetivos para acompanhar seu progresso.</p>
            <Button onClick={openCreate} size="lg" className="mt-6 font-bold shadow-xl shadow-blue-500/20 px-10">
              <Plus className="mr-2 h-5 w-5" />
              Criar Meta
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((g: any) => {
              const current = Number(g.currentAmount);
              const target = Number(g.targetAmount);
              const monthly = Number(g.monthlyContribution || 0);
              const progress = target > 0 ? (current / target) * 100 : 0;
              const remaining = target - current;
              const priority = priorityConfig[g.priority as keyof typeof priorityConfig] || priorityConfig.medium;
              
              const monthsLeft = monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null;
              const estimatedDate = monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)) : null;

              return (
                <motion.div 
                  key={g.id} 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{g.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", priority.bg, priority.color)}>
                            {priority.label}
                          </span>
                          {g.status === "completed" && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Concluída
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(g)} 
                        className="h-8 w-8 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-blue-600 shadow-none border-none"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => setDeleteId(g.id)} 
                        className="h-8 w-8 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-red-500 shadow-none border-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{fmt(current)}</span>
                      <span className="text-xs font-medium text-slate-500">de {fmt(target)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-emerald-500" : "bg-blue-500")} 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {progress.toFixed(1)}% completo
                      </span>
                      <span className={cn("text-xs font-medium", remaining > 0 ? "text-slate-500" : "text-emerald-600")}>
                        {remaining > 0 ? `Faltam ${fmt(remaining)}` : "Objetivo atingido!"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Mensal</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{monthly > 0 ? fmt(monthly) : "--"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Previsão</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {estimatedDate ? estimatedDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) : "--"}
                      </p>
                    </div>
                  </div>

                  {g.status === "active" && (
                    <Button 
                      onClick={() => { setDepositModal(g.id); setDepositForm(prev => ({ ...prev, accountId: accounts[0]?.id || "" })); }}
                      className="w-full font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 mt-6 h-12"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Depositar
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Meta" : "Nova Meta"} size="md">
        <div className="space-y-4 pt-2">
          <Field label="Nome da Meta" required error={errors.name}>
            <Input placeholder="Ex: Viagem, Carro..." value={form.name} onChange={e => set("name", e.target.value)} className="rounded-md" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor Alvo" required error={errors.targetAmount}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <Input type="number" step="0.01" className="pl-10 h-11 rounded-md" value={form.targetAmount} onChange={e => set("targetAmount", e.target.value)} />
              </div>
            </Field>
            <Field label="Valor Atual">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <Input disabled={!!editingId} title={editingId ? "O saldo atual só pode ser alterado através de depósitos." : ""} type="number" step="0.01" className="pl-10 h-11 rounded-md disabled:bg-slate-50 disabled:text-slate-500" value={form.currentAmount} onChange={e => set("currentAmount", e.target.value)} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contribuição Mensal">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <Input type="number" step="0.01" className="pl-10 h-11 rounded-md" value={form.monthlyContribution} onChange={e => set("monthlyContribution", e.target.value)} />
              </div>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={e => set("priority", e.target.value)} className="rounded-md h-11">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de Início" required>
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="rounded-md h-11" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => set("status", e.target.value)} className="rounded-md h-11">
                <option value="active">Em andamento</option>
                <option value="completed">Concluída</option>
                <option value="paused">Pausada</option>
              </Select>
            </Field>
          </div>

          <Field label="Observações">
            <Textarea placeholder="Detalhes..." value={form.notes} onChange={e => set("notes", e.target.value)} className="rounded-md" />
          </Field>

          <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-700 mt-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-[2] font-bold shadow-lg" onClick={save}>{editingId ? "Salvar Alterações" : "Criar Meta"}</Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Depositar na Meta" size="sm">
        <div className="space-y-4 pt-2">
          <Field label="Valor">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
              <Input 
                autoFocus type="number" step="0.01" className="pl-10 h-11 rounded-md" 
                value={depositForm.amount} onChange={e => setDepositForm(prev => ({ ...prev, amount: e.target.value }))} 
              />
            </div>
          </Field>

          <Field label="Conta de Origem">
            <Select value={depositForm.accountId} onChange={e => setDepositForm(prev => ({ ...prev, accountId: e.target.value }))} className="rounded-md">
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({fmt(Number(acc.balance))})</option>
              ))}
            </Select>
          </Field>

          <div className="flex gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setDepositModal(null)}>Cancelar</Button>
            <Button className="flex-1 font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" onClick={handleDeposit}>Confirmar Depósito</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Meta?" size="sm">
        <div className="text-center py-4">
          <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">O histórico será preservado.</p>
        </div>
        <div className="flex gap-4 mt-8">
          <Button variant="outline" className="flex-1 font-bold" onClick={() => setDeleteId(null)}>Voltar</Button>
          <Button variant="destructive" className="flex-1 font-bold shadow-lg shadow-red-500/20" onClick={async () => {
             try {
               await deleteGoal.mutateAsync(deleteId!);
               toast("Meta removida permanentemente");
               setDeleteId(null);
             } catch { toast("Erro ao deletar meta", "error"); }
          }}>Remover Meta</Button>
        </div>
      </Modal>
    </div>
  );
}
