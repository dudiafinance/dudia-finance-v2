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
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando contas...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-blue-500 rounded-full" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Minhas Contas</h1>
            </div>
            <p className="text-slate-400 font-medium">Gestão centralizada do seu ecossistema financeiro.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowBalances(!showBalances)}
              className="gap-3 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showBalances ? "Ocultar" : "Mostrar"}</span>
            </Button>

            <Button
              variant="soft"
              onClick={() => setTransferModalOpen(true)}
              className="gap-3 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Transferir</span>
            </Button>

            <Button
              onClick={openCreate}
              className="gap-3 font-bold"
            >
              <Plus className="h-5 w-5" />
              <span>Nova Conta</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Saldo Disponível</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {showBalances ? fmt(totalBalance) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">{accounts.filter(a => a.includeInTotal).length} contas inclusas</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Investimentos</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {showBalances ? fmt(totalInvestments) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Liquidez imediata</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Pendências Cartão</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {showBalances ? fmt(totalCredit) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Faturas abertas</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar por nome ou banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11"
            />
          </div>
        </div>

        <div className="space-y-10">
          {groupedByType.map(({ value: type, label, icon: Icon, gradient, items }) => (
            <section key={type}>
              <div className="flex items-center gap-3 mb-5">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{label}</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-slate-500 font-medium text-sm">{items.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((a: any) => {
                  const AccIcon = getIcon(a.type);
                  const balance = Number(a.balance);
                  
                  return (
                    <motion.div
                      key={a.id}
                      whileHover={{ y: -4 }}
                      className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openEdit(a)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: a.color }}
                        >
                          <AccIcon className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="secondary"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                            className="h-8 w-8 bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-900 hover:text-white shadow-none border-none"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }}
                            className="h-8 w-8 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white shadow-none border-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{a.name}</h3>
                        <p className="text-xs text-slate-500">{a.bank || label}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo</span>
                          {!a.includeInTotal && (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">OFF</span>
                          )}
                        </div>
                        <p className={cn(
                          "text-xl font-bold tabular-nums",
                          balance < 0 ? "text-red-500" : "text-slate-900 dark:text-white"
                        )}>
                          {showBalances ? fmt(balance) : "••••••"}
                        </p>
                      </div>
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
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Tipo da Conta</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon, gradient }) => (
                <Button 
                  key={value} 
                  variant="ghost"
                  onClick={() => set("type", value)}
                  className={cn("relative h-auto flex flex-col items-center gap-2 p-4 transition-all border-2",
                    form.type === value 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {form.type === value && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shadow-sm", 
                    form.type === value ? gradient : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    <Icon className={cn("h-5 w-5", form.type === value ? "text-white" : "text-slate-400")} />
                  </div>
                  <span className={cn("text-[11px] font-bold uppercase tracking-widest",
                    form.type === value ? "text-blue-600 dark:text-blue-400" : "text-slate-500"
                  )}>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <FormRow>
            <Field label="Nome" required error={errors.name}>
              <Input placeholder="Ex: Conta Principal..." value={form.name}
                onChange={(e) => set("name", e.target.value)} error={!!errors.name} className="h-11 rounded-md" />
            </Field>
            <Field label="Banco">
              <Input placeholder="Ex: Nubank..." value={form.bank}
                onChange={(e) => set("bank", e.target.value)} className="h-11 rounded-md" />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Saldo">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <Input type="number" step="0.01" placeholder="0,00"
                  value={form.balance} onChange={(e) => set("balance", e.target.value)} className="pl-10 h-11 rounded-md font-semibold" />
              </div>
            </Field>
            <Field label="Moeda">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="h-11 rounded-md">
                <option value="BRL">BRL - Real</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </Select>
            </Field>
          </FormRow>

          {(form.type === "checking" || form.type === "savings") && (
            <FormRow>
              <Field label="Agência">
                <Input placeholder="0001" value={form.agency} onChange={(e) => set("agency", e.target.value)} className="h-11 rounded-md" />
              </Field>
              <Field label="Conta">
                <Input placeholder="12345-6" value={form.number} onChange={(e) => set("number", e.target.value)} className="h-11 rounded-md" />
              </Field>
            </FormRow>
          )}

          <FormDivider label="Visualização" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <Field label="Cor">
              <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
            </Field>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 transition-colors">
              <input type="checkbox" checked={form.includeInTotal} onChange={(e) => set("includeInTotal", e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Incluir no Total</p>
                <p className="text-xs text-slate-500">Soma no dashboard geral</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="font-bold flex-1">Cancelar</Button>
            <Button onClick={save} className="font-bold shadow-lg flex-[2]">
              {editingId ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)}
        title="Transferência entre Contas"
        size="lg">
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">De (Origem)</label>
              {accounts.filter(a => a.type !== 'credit_card').map((a: any) => (
                <Button 
                  key={a.id}
                  variant="ghost"
                  onClick={() => setTransferForm(f => ({ ...f, fromAccountId: a.id }))}
                  className={cn("w-full h-auto flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                    transferForm.fromAccountId === a.id ? "border-red-500/50 bg-red-50 dark:bg-red-900/10" : "border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100"
                  )}
                >
                  <p className="text-sm font-bold truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{fmt(Number(a.balance))}</p>
                </Button>
              ))}
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Para (Destino)</label>
              {accounts.filter(a => a.id !== transferForm.fromAccountId).map((a: any) => (
                <Button 
                  key={a.id}
                  variant="ghost"
                  onClick={() => setTransferForm(f => ({ ...f, toAccountId: a.id }))}
                  className={cn("w-full h-auto flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                    transferForm.toAccountId === a.id ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/10" : "border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100"
                  )}
                >
                  <p className="text-sm font-bold truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{fmt(Number(a.balance))}</p>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Field label="Valor">
              <Input type="number" step="0.01" value={transferForm.amount}
                onChange={(e) => setTransferForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00" className="h-11 rounded-md font-semibold" />
            </Field>
            <Field label="Data">
              <Input type="date" value={transferForm.date}
                onChange={(e) => setTransferForm(f => ({ ...f, date: e.target.value }))}
                className="h-11 rounded-md" />
            </Field>
          </div>

          <Field label="Descrição">
            <Input value={transferForm.description}
              onChange={(e) => setTransferForm(f => ({ ...f, description: e.target.value }))}
              className="h-11 rounded-md" />
          </Field>

          <Button onClick={handleTransfer} 
            className="w-full mt-4 font-bold shadow-lg h-12">
            Confirmar Transferência
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Conta" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Confirmar Exclusão?</h3>
              <p className="text-sm text-slate-500 mt-1">O histórico será preservado.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 rounded-md font-medium">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 rounded-md font-semibold">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
