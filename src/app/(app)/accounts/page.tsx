"use client";

import { useState } from "react";
import { 
  Plus, Search, Edit, Trash2, Wallet, CreditCard, 
  Building, PiggyBank, TrendingUp, Eye, EyeOff, 
  ArrowRightLeft, ArrowUpRight, ArrowDownRight,
  ChevronRight, ArrowRight
} from "lucide-react";
import { 
  useAccounts, 
  useCreateAccount, 
  useUpdateAccount, 
  useDeleteAccount,
  useCreateTransfer,
  useCategories
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow, FormDivider } from "@/components/ui/form-field";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente", icon: Wallet, gradient: "from-blue-600 to-indigo-600" },
  { value: "savings", label: "Poupança", icon: PiggyBank, gradient: "from-emerald-500 to-teal-600" },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard, gradient: "from-violet-600 to-purple-700" },
  { value: "investment", label: "Investimento", icon: TrendingUp, gradient: "from-amber-500 to-orange-600" },
];

function getIcon(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.icon ?? Wallet;
}

type FormData = {
  name: string;
  type: string;
  bank: string;
  agency: string;
  number: string;
  balance: string;
  color: string;
  currency: string;
  includeInTotal: boolean;
};

const emptyForm = (): FormData => ({
  name: "",
  type: "checking",
  bank: "",
  agency: "",
  number: "",
  balance: "0",
  color: "#10B981",
  currency: "BRL",
  includeInTotal: true,
});

export default function AccountsPage() {
  const { toast } = useToast();
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTransfer = useCreateTransfer();

  const [searchTerm, setSearchTerm] = useState("");
  const [showBalances, setShowBalances] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "Transferência entre contas",
    date: new Date().toISOString().split("T")[0],
    categoryId: ""
  });

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

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      type: a.type,
      bank: a.bank ?? "",
      agency: a.agency ?? "",
      number: a.number ?? "",
      balance: String(Number(a.balance)),
      color: a.color,
      currency: a.currency,
      includeInTotal: a.includeInTotal,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const formPayload = {
      name: form.name,
      type: form.type,
      bank: form.bank || undefined,
      agency: form.agency || undefined,
      number: form.number || undefined,
      balance: Number(form.balance),
      color: form.color,
      currency: form.currency,
      includeInTotal: form.includeInTotal,
    };
    try {
      if (editingId) {
        await updateAccount.mutateAsync({ id: editingId, ...formPayload });
        toast("Conta atualizada!");
      } else {
        await createAccount.mutateAsync(formPayload);
        toast("Conta criada!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar", "error");
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
      toast("Preencha todos os campos da transferência", "warning");
      return;
    }
    try {
      await createTransfer.mutateAsync({
        ...transferForm,
        amount: Number(transferForm.amount),
        categoryId: transferForm.categoryId || null
      });
      toast("Transferência concluída!");
      setTransferModalOpen(false);
    } catch (e: any) {
      toast(e.message ?? "Erro na transferência", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAccount.mutateAsync(deleteId);
      toast("Conta excluída.", "warning");
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const filtered = accounts.filter((a: any) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.bank ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts
    .filter((a: any) => a.includeInTotal && a.type !== "credit_card")
    .reduce((s: number, a: any) => s + Number(a.balance), 0);
  
  const totalInvestments = accounts
    .filter((a: any) => a.type === "investment")
    .reduce((s: number, a: any) => s + Number(a.balance), 0);

  const totalCredit = accounts
    .filter((a: any) => a.type === "credit_card")
    .reduce((s: number, a: any) => s + Math.abs(Number(a.balance)), 0);

  const groupedByType = ACCOUNT_TYPES.map((t) => ({
    ...t,
    items: filtered.filter((a: any) => a.type === t.value),
  })).filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Sincronizando suas contas...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Imersivo */}
      <div className="relative overflow-hidden pt-12 pb-24 px-8 mb-[-60px]">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 opacity-80" />
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="h-8 w-1.5 bg-emerald-500 rounded-full" />
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Minhas Contas</h1>
            </div>
            <p className="text-slate-400 text-lg font-medium">Gestão centralizada de todo o seu ecossistema financeiro.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <button
                onClick={() => setShowBalances(!showBalances)}
                className="h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md"
              >
                {showBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="font-bold text-sm uppercase tracking-widest">{showBalances ? "Ocultar" : "Mostrar"}</span>
              </button>

              <button
                onClick={() => setTransferModalOpen(true)}
                className="h-14 px-6 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 hover:bg-indigo-500/30 transition-all flex items-center gap-3 backdrop-blur-md"
              >
                <ArrowRightLeft className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-widest">Transferir</span>
              </button>

              <button
                onClick={openCreate}
                className="h-14 px-8 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
              >
                <Plus className="h-6 w-6 font-bold" />
                <span className="font-black text-sm uppercase tracking-widest">Nova Conta</span>
              </button>
          </div>
        </div>

        {/* Estatísticas Flutuantes */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-[1200px]">
           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                 <Wallet className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Saldo Disponível</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {showBalances ? fmt(totalBalance) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold">
                 <span>{accounts.filter(a => a.includeInTotal).length} CONTAS E CARTEIRAS INCLUSAS</span>
              </div>
           </div>

           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-amber-400">
                 <TrendingUp className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Investimentos</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {showBalances ? fmt(totalInvestments) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold font-mono">
                 <span>LIQUIDEZ IMEDIATA E FIXA</span>
              </div>
           </div>

           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-violet-400">
                 <CreditCard className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pendências Cartão</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {showBalances ? fmt(totalCredit) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold">
                 <span>TOTAL EM FATURAS ABERTAS</span>
              </div>
           </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-8 pb-32">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="relative group flex-1 max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-16 w-full rounded-[24px] border-white/20 bg-white/60 pl-16 pr-8 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 backdrop-blur-xl transition-all"
              />
           </div>
        </div>

        <div className="space-y-20">
          {groupedByType.map(({ value: type, label, icon: Icon, gradient, items }, typeIdx) => (
            <section key={type} className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="flex items-center gap-4 mb-8">
                 <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg", gradient)}>
                   <Icon className="h-5 w-5 text-white" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{label}</h2>
                 <div className="h-px flex-1 bg-slate-200" />
                 <span className="text-slate-400 font-bold">{items.length} itens</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
                {items.map((a: any, idx: number) => {
                  const AccIcon = getIcon(a.type);
                  const balance = Number(a.balance);
                  
                  return (
                    <motion.div
                      key={a.id}
                      whileHover={{ y: -10 }}
                      className="group relative overflow-hidden glass-card rounded-[44px] bg-white border-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all cursor-pointer active:scale-[0.98]"
                      onClick={() => openEdit(a)}
                    >
                      {/* Background Efeito */}
                      <div className="absolute top-0 right-0 p-8 h-32 w-32 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all">
                         <AccIcon className="h-32 w-32" />
                      </div>

                      <div className="flex items-start justify-between mb-8">
                        <div 
                          className="h-16 w-16 rounded-[28px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6"
                          style={{ backgroundColor: a.color }}
                        >
                          <AccIcon className="h-8 w-8 text-white" />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{a.name}</h3>
                        <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                           {a.bank ? <span>{a.bank}</span> : <span className="uppercase tracking-widest text-[10px] opacity-60">{label}</span>}
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-100/60">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SALDO ATUAL</span>
                            {!a.includeInTotal && (
                              <span className="bg-slate-100 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-full">OFF-TOTAL</span>
                            )}
                         </div>
                         <div className="flex items-end justify-between gap-4">
                            <p className={cn(
                              "text-3xl font-black tracking-tighter tabular-nums",
                              balance < 0 ? "text-red-500" : "text-slate-900"
                            )}>
                              {showBalances ? fmt(balance) : "••••••"}
                            </p>
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                               <ChevronRight className="h-5 w-5" />
                            </div>
                         </div>
                      </div>

                      {/* Info Detalhes (Mono) */}
                      {a.number && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span>AG: {a.agency}</span>
                           <span className="h-1 w-1 rounded-full bg-slate-200" />
                           <span>CC: {a.number}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Modal de Nova/Editar Conta */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Conta" : "Nova Conta Bancária"}
        description="Configure os parâmetros fundamentais desta conta" size="lg">
        <div className="space-y-6 pt-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Escolha a Categoria</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon, gradient }) => (
                <button key={value} type="button" onClick={() => set("type", value)}
                  className={cn("relative flex flex-col items-center gap-3 rounded-[28px] border-2 p-5 transition-all group overflow-hidden",
                    form.type === value 
                      ? "border-emerald-500 bg-emerald-50/50" 
                      : "border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200"
                  )}>
                  {form.type === value && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-md", 
                    form.type === value ? gradient : "bg-white text-slate-400"
                  )}>
                    <Icon className={cn("h-6 w-6", form.type === value ? "text-white" : "text-slate-400")} />
                  </div>
                  <span className={cn("text-[11px] font-black uppercase tracking-tighter text-center leading-tight",
                    form.type === value ? "text-emerald-700" : "text-slate-400"
                  )}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <FormRow>
            <Field label="Nome de Exibição" required error={errors.name}>
              <Input placeholder="Ex: Conta Principal, Reserva..." value={form.name}
                onChange={(e) => set("name", e.target.value)} error={!!errors.name} className="h-14 rounded-2xl font-bold" />
            </Field>
            <Field label="Banco / Instituição">
              <Input placeholder="Ex: Nubank, Itaú..." value={form.bank}
                onChange={(e) => set("bank", e.target.value)} className="h-14 rounded-2xl font-bold" />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Saldo Inicial / Atual">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                <Input type="number" step="0.01" placeholder="0,00"
                  value={form.balance} onChange={(e) => set("balance", e.target.value)} className="pl-12 h-14 rounded-2xl font-black text-xl" />
              </div>
            </Field>
            <Field label="Moeda Padrão">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="h-14 rounded-2xl font-bold">
                <option value="BRL">🇧🇷 Real Brasileiro (BRL)</option>
                <option value="USD">🇺🇸 Dólar Americano (USD)</option>
                <option value="EUR">🇪🇺 Euro (EUR)</option>
              </Select>
            </Field>
          </FormRow>

          {(form.type === "checking" || form.type === "savings") && (
            <FormRow>
              <Field label="Agência (Opcional)">
                <Input placeholder="0001" value={form.agency} onChange={(e) => set("agency", e.target.value)} className="h-14 rounded-2xl" />
              </Field>
              <Field label="Conta (Opcional)">
                <Input placeholder="12345-6" value={form.number} onChange={(e) => set("number", e.target.value)} className="h-14 rounded-2xl" />
              </Field>
            </FormRow>
          )}

          <FormDivider label="Design e Visibilidade" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <Field label="Cor do Tema">
               <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
             </Field>
             <label className="flex items-center gap-4 p-6 rounded-[28px] border-2 border-slate-100 bg-slate-50/30 cursor-pointer hover:border-emerald-200 transition-colors">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={form.includeInTotal} onChange={(e) => set("includeInTotal", e.target.checked)}
                    className="peer sr-only" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <div>
                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Incluir no Total</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase leading-tight">Soma no dashboard geral</p>
                </div>
             </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="h-14 px-8 rounded-2xl font-bold">Cancelar</Button>
            <Button onClick={save} className="h-14 px-10 rounded-2xl bg-emerald-500 text-slate-950 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              {editingId ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Transferência */}
      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)}
        title="Atalho de Transferência"
        description="Mova saldo entre suas contas de forma rápida e segura" size="lg">
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">De (Origem)</label>
                <div className="grid grid-cols-1 gap-2">
                   {accounts.filter(a => a.type !== 'credit_card').map((a: any) => (
                      <button 
                        key={a.id}
                        onClick={() => setTransferForm(f => ({ ...f, fromAccountId: a.id }))}
                        className={cn("flex flex-col p-4 rounded-2xl border-2 transition-all",
                          transferForm.fromAccountId === a.id ? "border-red-500 bg-red-50" : "border-slate-100 opacity-60 hover:opacity-100"
                        )}
                      >
                         <p className="text-xs font-black uppercase tracking-tight truncate">{a.name}</p>
                         <p className="text-[10px] font-bold text-slate-400">{fmt(Number(a.balance))}</p>
                      </button>
                   ))}
                </div>
             </div>
             
             <div className="hidden md:flex flex-col items-center justify-center text-slate-300">
                <ArrowRight className="h-8 w-8" />
             </div>

             <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Para (Destino)</label>
                <div className="grid grid-cols-1 gap-2">
                   {accounts.filter(a => a.id !== transferForm.fromAccountId).map((a: any) => (
                      <button 
                        key={a.id}
                        onClick={() => setTransferForm(f => ({ ...f, toAccountId: a.id }))}
                        className={cn("flex flex-col p-4 rounded-2xl border-2 transition-all",
                          transferForm.toAccountId === a.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 opacity-60 hover:opacity-100"
                        )}
                      >
                         <p className="text-xs font-black uppercase tracking-tight truncate">{a.name}</p>
                         <p className="text-[10px] font-bold text-slate-400">{fmt(Number(a.balance))}</p>
                      </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
             <Field label="Valor da Transferência">
                <Input type="number" step="0.01" value={transferForm.amount}
                  onChange={(e) => setTransferForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00" className="h-16 text-2xl font-black rounded-3xl" />
             </Field>
             <Field label="Data">
                <Input type="date" value={transferForm.date}
                  onChange={(e) => setTransferForm(f => ({ ...f, date: e.target.value }))}
                  className="h-16 font-bold rounded-3xl" />
             </Field>
          </div>

          <Field label="Descrição Curta">
             <Input value={transferForm.description}
               onChange={(e) => setTransferForm(f => ({ ...f, description: e.target.value }))}
               className="h-14 rounded-2xl" />
          </Field>

          <Field label="Categoria (Opcional)">
             <Select value={transferForm.categoryId}
               onChange={(e) => setTransferForm(f => ({ ...f, categoryId: e.target.value }))}
               className="h-14 rounded-2xl">
               <option value="">Nenhuma</option>
               {categories.map((c: any) => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </Select>
          </Field>

          <Button 
            onClick={handleTransfer} 
            className="w-full h-16 rounded-[28px] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all">
            Confirmar Transferência
          </Button>
        </div>
      </Modal>

      {/* Modal Exclusão */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Conta" size="sm">
        <div className="p-4 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900">Confirmar Exclusão?</h3>
                <p className="text-sm text-slate-500 mt-2">Esta ação ocultará a conta, mas o histórico de transações será preservado para integridade dos relatórios.</p>
             </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl font-bold">Voltar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 h-12 rounded-xl font-black uppercase tracking-tighter text-sm">Sim, Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
