"use client";

import { useState } from "react";
import {
  Plus, Search, Edit, Trash2, Wallet, CreditCard,
  PiggyBank, TrendingUp, Eye, EyeOff,
  ArrowRightLeft
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
import { Field, Input, Select, FormDivider } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

type Account = {
  id: string;
  name: string;
  type: string;
  bank?: string;
  agency?: string;
  number?: string;
  balance: number | string;
  color: string;
  currency: string;
  includeInTotal: boolean;
};

type Category = {
  id: string;
  name: string;
  color?: string;
};

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
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

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

  const openEdit = (a: Account) => {
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
      type: form.type as "checking" | "savings" | "credit_card" | "investment",
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
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
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
        categoryId: transferForm.categoryId || undefined
      });
      toast("Transferência concluída!");
      setTransferModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro na transferência", "error");
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

  const typedAccounts = accounts as unknown as Account[];
  const typedCategories = categories as unknown as Category[];

  const filtered = typedAccounts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.bank ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = typedAccounts
    .filter((a) => a.includeInTotal && a.type !== "credit_card")
    .reduce((s, a) => s + Number(a.balance), 0);

  const totalInvestments = typedAccounts
    .filter((a) => a.type === "investment")
    .reduce((s, a) => s + Number(a.balance), 0);

  const totalCredit = typedAccounts
    .filter((a) => a.type === "credit_card")
    .reduce((s, a) => s + Math.abs(Number(a.balance)), 0);

  const groupedByType = ACCOUNT_TYPES.map((t) => ({
    ...t,
    items: filtered.filter((a) => a.type === t.value),
  })).filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando contas...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Visão Patrimonial</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Minhas Contas</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowBalances(!showBalances)}
              className="gap-2 h-8 text-[11px] font-bold uppercase"
            >
              {showBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showBalances ? "Ocultar" : "Mostrar"}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setTransferModalOpen(true)}
              className="gap-2 h-8 text-[11px] font-bold uppercase border-border shadow-precision"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Transferir</span>
            </Button>

            <Button
              onClick={openCreate}
              className="gap-2 h-8 text-[11px] font-bold uppercase"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Conta</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Wallet className="h-3 w-3 text-success" />
              Saldo Disponível
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalBalance) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-warning" />
              Investimentos
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalInvestments) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-error" />
              Pendências Cartão
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalCredit) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-[13px] bg-secondary/30 border-border focus:bg-background shadow-precision"
            />
          </div>
        </div>

        <div className="space-y-12">
          {groupedByType.map(({ value: type, label, items }) => (
            <section key={type}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</h2>
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums bg-secondary px-2 py-0.5 rounded border border-border/50">{items.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((a) => {
                  const AccIcon = getIcon(a.type);
                  const balance = Number(a.balance);
                  
                  return (
                    <motion.div
                      key={a.id}
                      whileHover={{ y: -2 }}
                      className="group relative bg-background rounded-lg border border-border/50 p-6 hover:border-border transition-all duration-300 shadow-precision cursor-pointer overflow-hidden"
                      onClick={() => openEdit(a)}
                    >
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div 
                          className="h-10 w-10 rounded flex items-center justify-center border border-white/5 shadow-precision group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: a.color }}
                        >
                          <AccIcon className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }}
                            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error-subtle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-6 relative z-10">
                        <h3 className="text-sm font-bold text-foreground tracking-tight truncate">{a.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{a.bank || label}</p>
                      </div>

                      <div className="pt-4 border-t border-border/50 relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Atual</span>
                          {!a.includeInTotal && (
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50 px-1.5 py-0.5 rounded">Off</span>
                          )}
                        </div>
                        <p className={cn(
                          "text-lg font-bold tabular-nums tracking-tight",
                          balance < 0 ? "text-error" : "text-foreground"
                        )}>
                          {showBalances ? fmt(balance) : "••••••"}
                        </p>
                      </div>

                      {/* Backdrop Accent */}
                      <div className="absolute top-0 right-0 h-16 w-16 opacity-5 blur-3xl rounded-full -mr-8 -mt-8" style={{ backgroundColor: a.color }} />
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Conta" : "Nova Conta"}
        size="lg">
        <div className="space-y-8 pt-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Arquitetura da Conta</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                <button 
                  key={value} 
                  type="button"
                  onClick={() => set("type", value)}
                  className={cn("relative flex flex-col items-center gap-3 p-4 transition-all border rounded-lg group shadow-precision",
                    form.type === value 
                      ? "border-foreground/20 bg-secondary" 
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/50"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded flex items-center justify-center transition-transform group-hover:scale-110", 
                    form.type === value ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest text-center leading-tight",
                    form.type === value ? "text-foreground" : "text-muted-foreground"
                  )}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <Field label="Identificação da Conta" required error={errors.name}>
                <Input placeholder="Ex: Conta Principal" value={form.name}
                  onChange={(e) => set("name", e.target.value)} error={!!errors.name} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>
              
              <Field label="Instituição Financeira">
                <Input placeholder="Ex: Nubank" value={form.bank}
                  onChange={(e) => set("bank", e.target.value)} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Saldo Inicial (Ajuste)">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" placeholder="0,00"
                    value={form.balance} onChange={(e) => set("balance", e.target.value)} 
                    className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" />
                </div>
              </Field>

              <Field label="Moeda de Operação">
                <Select value={form.currency} onChange={(e) => set("currency", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground uppercase font-bold tracking-widest">
                  <option value="BRL">BRL - Real</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </Select>
              </Field>
            </div>
          </div>

          <FormDivider label="Customização & Visibilidade" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Field label="Assinatura Visual (Cor)">
              <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
            </Field>
            
            <label className="flex items-center gap-4 p-5 rounded-lg border border-border/50 bg-secondary/30 shadow-precision cursor-pointer transition-all hover:bg-secondary">
              <input type="checkbox" checked={form.includeInTotal} onChange={(e) => set("includeInTotal", e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-foreground focus:ring-zinc-500" />
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">Consolidar no Patrimônio</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Os valores desta conta serão somados ao seu saldo total global.</p>
              </div>
            </label>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={save} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
              {editingId ? "Confirmar Alterações" : "Efetivar Nova Conta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)}
        title="Transferência entre Contas"
        size="lg">
        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Origem do Recurso</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {typedAccounts.filter(a => a.type !== 'credit_card').map((a) => (
                  <button 
                    key={a.id}
                    type="button"
                    onClick={() => setTransferForm(f => ({ ...f, fromAccountId: a.id }))}
                    className={cn("w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left shadow-precision",
                      transferForm.fromAccountId === a.id ? "border-red-500/30 bg-red-500/5" : "border-border/50 hover:border-border bg-background"
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-tight truncate">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tabular-nums">{fmt(Number(a.balance))}</p>
                    </div>
                    {transferForm.fromAccountId === a.id && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destino do Recurso</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {typedAccounts.filter(a => a.id !== transferForm.fromAccountId).map((a) => (
                  <button 
                    key={a.id}
                    type="button"
                    onClick={() => setTransferForm(f => ({ ...f, toAccountId: a.id }))}
                    className={cn("w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left shadow-precision",
                      transferForm.toAccountId === a.id ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 hover:border-border bg-background"
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-tight truncate">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tabular-nums">{fmt(Number(a.balance))}</p>
                    </div>
                    {transferForm.toAccountId === a.id && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-border/50">
            <div className="space-y-6">
              <Field label="Valor da Transferência">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" value={transferForm.amount}
                    onChange={(e) => setTransferForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0,00" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" />
                </div>
              </Field>

              <Field label="Data da Operação">
                <Input type="date" value={transferForm.date}
                  onChange={(e) => setTransferForm(f => ({ ...f, date: e.target.value }))}
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Categoria Associada">
                <SearchableSelect 
                  options={typedCategories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                  value={transferForm.categoryId}
                  onChange={val => setTransferForm(f => ({ ...f, categoryId: val }))}
                  placeholder="Selecione..."
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </Field>

              <Field label="Observação">
                <Input value={transferForm.description}
                  onChange={(e) => setTransferForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Transferência saldo"
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </Field>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setTransferModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={handleTransfer} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
              Efetivar Transferência
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Conta" size="sm">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Remover Conta?</h3>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">Esta conta será arquivada. O histórico de transações não será afetado, mas a conta deixará de aparecer no patrimônio.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Voltar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Remover</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
