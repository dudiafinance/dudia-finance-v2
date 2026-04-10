"use client";

import { useState, useMemo } from "react";
import { 
  Plus, Edit, Trash2, Target, CheckCircle2, PlusCircle, Info
} from "lucide-react";
import { 
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, 
  useAccounts, useGoalDeposit 
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

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

type Goal = {
  id: string;
  name: string;
  goalType?: string;
  targetAmount?: number | string | null;
  currentAmount?: number | string;
  startDate?: string;
  endDate?: string;
  monthlyContribution?: number | string | null;
  priority: string;
  status: string;
  notes?: string;
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
  high: { label: "Alta", color: "text-error", bg: "bg-error-subtle", border: "border-error-subtle" },
  medium: { label: "Média", color: "text-warning", bg: "bg-warning-subtle", border: "border-warning-subtle" },
  low: { label: "Baixa", color: "text-success", bg: "bg-success-subtle", border: "border-success-subtle" },
} as const;

export default function GoalsPage() {
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
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
  
  const showBalances = true;

  const set = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
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
      if (editingId) await updateGoal.mutateAsync({ id: editingId, ...payload } as any);
      else await createGoal.mutateAsync(payload as any);
      toast(editingId ? "Meta atualizada!" : "Meta criada com sucesso!");
      setModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar meta", "error");
    }
  };

  const handleDeposit = async () => {
    if (!depositForm.amount || !depositForm.accountId || !depositModal) {
      toast("Preencha o valor e selecione a conta", "error");
      return;
    }
    try {
      const gName = goals.find((g) => g.id === depositModal)?.name;
      await depositToGoal.mutateAsync({
        goalId: depositModal,
        accountId: depositForm.accountId,
        amount: Number(depositForm.amount),
        date: depositForm.date,
        description: `Depósito: ${gName}`
      });
      toast("Depósito realizado!");
      setDepositModal(null);
      setDepositForm({ amount: "", accountId: "", date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro no depósito", "error");
    }
  };

  const stats = useMemo(() => {
    const active = goals.filter((g) => g.status === "active");
    const totalTarget = active.reduce((acc, g) => acc + Number(g.targetAmount || 0), 0);
    const totalCurrent = goals.reduce((acc, g) => acc + Number(g.currentAmount || 0), 0);
    return {
      total: goals.length,
      active: active.length,
      totalTarget,
      totalCurrent,
      progress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
    };
  }, [goals]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando objetivos...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Planejamento de Futuro</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Metas</h1>
          </div>
          <Button onClick={openCreate} className="gap-2 h-8 text-[11px] font-bold uppercase shadow-precision">
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Meta</span>
          </Button>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Total Guardado
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(stats.totalCurrent) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Target className="h-3 w-3 text-foreground" />
              Metas Ativas
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold tabular-nums text-foreground">{stats.active}</p>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">de {stats.total}</span>
            </div>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <PlusCircle className="h-3 w-3 text-muted-foreground" />
              Valor Alvo Total
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(stats.totalTarget) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Target className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma meta configurada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((g: any) => {
              const current = Number(g.currentAmount);
              const target = Number(g.targetAmount || 0);
              const monthly = Number(g.monthlyContribution || 0);
              const progress = target > 0 ? (current / target) * 100 : 0;
              const priority = (priorityConfig as any)[g.priority] || priorityConfig.medium;
              
              const remaining = target - current;
              const monthsLeft = monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null;
              const estimatedDate = monthsLeft ? new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)) : null;

              return (
                <motion.div 
                  key={g.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative bg-background rounded-lg border border-border/50 p-6 hover:border-border transition-all duration-300 shadow-precision overflow-hidden"
                  onClick={() => openEdit(g)}
                >
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary border border-border/50 shadow-precision group-hover:scale-105 transition-transform">
                        <Target className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground tracking-tight">{g.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border", priority.border, priority.color)}>
                            {priority.label}
                          </span>
                          {g.status === "completed" && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-success uppercase tracking-widest">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Concluída
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openEdit(g); }} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(g.id); }} 
                        className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error-subtle"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-bold text-foreground tabular-nums tracking-tight">{fmt(current)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">alvo: {fmt(target)}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-secondary overflow-hidden border border-border/10">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", progress >= 100 ? "bg-success" : "bg-foreground")} 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {progress.toFixed(1)}% COMPLETADO
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/50 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Mensal</p>
                      <p className="text-[11px] font-bold text-foreground tabular-nums">{monthly > 0 ? fmt(monthly) : "—"}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Estimativa</p>
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-tighter">
                        {estimatedDate ? estimatedDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) : "—"}
                      </p>
                    </div>
                  </div>

                  {g.status === "active" && progress < 100 && (
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setDepositModal(g.id); setDepositForm(prev => ({ ...prev, accountId: accounts[0]?.id || "" })); }}
                      className="w-full h-10 text-[10px] font-bold uppercase tracking-widest shadow-precision mt-2"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-2" />
                      Efetuar Aporte
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Meta" : "Nova Meta"} size="md">
        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <Field label="Identificação do Objetivo" required error={errors.name}>
                <Input placeholder="Ex: Reserva de Emergência" value={form.name} onChange={e => set("name", e.target.value)} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>

              <Field label="Valor Alvo Final" required error={errors.targetAmount}>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" value={form.targetAmount} onChange={e => set("targetAmount", e.target.value)} />
                </div>
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Saldo Inicial">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input disabled={!!editingId} type="number" step="0.01" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums disabled:opacity-40" value={form.currentAmount} onChange={e => set("currentAmount", e.target.value)} />
                </div>
              </Field>

              <Field label="Aporte Mensal Previsto">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" value={form.monthlyContribution} onChange={e => set("monthlyContribution", e.target.value)} />
                </div>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <Field label="Prioridade Estratégica">
                <Select value={form.priority} onChange={e => set("priority", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground font-bold tracking-widest uppercase">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </Select>
              </Field>

              <Field label="Data de Início">
                <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Status Operacional">
                <Select value={form.status} onChange={e => set("status", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground font-bold tracking-widest uppercase">
                  <option value="active">Em andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="paused">Pausada</option>
                </Select>
              </Field>

              <Field label="Notas Técnicas">
                <Input placeholder="Detalhes adicionais..." value={form.notes} onChange={e => set("notes", e.target.value)} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={save} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
              {editingId ? "Salvar Alterações" : "Criar Nova Meta"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Efetuar Aporte" size="sm">
        <div className="space-y-8 pt-4">
          <div className="bg-secondary/30 rounded-xl p-8 text-center border border-border/50 shadow-precision">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Valor do Aporte</p>
            <div className="relative flex justify-center items-center">
              <span className="text-xl font-light text-muted-foreground mr-2">R$</span>
              <input 
                autoFocus type="number" step="0.01" placeholder="0,00"
                className="bg-transparent text-4xl font-bold tracking-tighter text-foreground focus:outline-none w-full max-w-[180px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                value={depositForm.amount} onChange={e => setDepositForm(prev => ({ ...prev, amount: e.target.value }))} 
              />
            </div>
          </div>

          <div className="space-y-6">
            <Field label="Conta de Origem">
              <Select value={depositForm.accountId} onChange={e => setDepositForm(prev => ({ ...prev, accountId: e.target.value }))} 
                className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({fmt(Number(acc.balance))})</option>
                ))}
              </Select>
            </Field>

            <Field label="Data da Operação">
              <Input type="date" value={depositForm.date} onChange={e => setDepositForm(prev => ({ ...prev, date: e.target.value }))} 
                className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setDepositModal(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={handleDeposit} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">Confirmar Aporte</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Meta" size="sm">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-error-subtle flex items-center justify-center text-error border border-error-subtle">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Remover Objetivo?</h3>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">Esta meta deixará de ser monitorada. O saldo atual retornará para sua gestão livre.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Voltar</Button>
            <Button variant="destructive" onClick={async () => {
               try {
                 await deleteGoal.mutateAsync(deleteId!);
                 toast("Meta removida permanentemente");
                 setDeleteId(null);
               } catch { toast("Erro ao deletar meta", "error"); }
            }} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
