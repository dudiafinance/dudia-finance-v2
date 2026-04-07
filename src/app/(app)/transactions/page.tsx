"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Edit, Trash2, Calendar, CheckCircle2, Clock, Filter, X, ChevronDown,
  RefreshCw, Repeat2, TrendingUp, TrendingDown, Wallet, Eye, EyeOff,
  ChevronRight, MapPin, Tag, FileText, ArrowRight
} from "lucide-react";
import { 
  useTransactions, 
  useCategories, 
  useAccounts, 
  useCreateTransaction, 
  useUpdateTransaction, 
  useDeleteTransaction, 
  useTags 
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea, FormRow, FormDivider } from "@/components/ui/form-field";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const toDateInput = (d?: any) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

type Subtype = "single" | "fixed" | "recurring";

type FormData = {
  type: "income" | "expense" | "transfer";
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  date: string;
  dueDate: string;
  receiveDate: string;
  isPaid: boolean;
  subtype: Subtype;
  totalOccurrences: string;
  notes: string;
  tags: string[];
  location: string;
};

const emptyForm = (): FormData => ({
  type: "expense",
  description: "",
  amount: "",
  categoryId: "",
  accountId: "",
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  receiveDate: "",
  isPaid: true,
  subtype: "single",
  totalOccurrences: "2",
  notes: "",
  tags: [],
  location: "",
});

function getMonthName(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function computeEndMonth(startDateStr: string, n: number) {
  if (!startDateStr || isNaN(n) || n < 2) return "";
  const d = new Date(startDateStr + "T12:00:00");
  d.setMonth(d.getMonth() + n - 1);
  return getMonthName(d);
}

function getRelativeGroupDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  target.setHours(0, 0, 0, 0);
  
  const diff = today.getTime() - target.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  return target.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accountsData = [] } = useAccounts();
  const { data: globalTags = [] } = useTags();
  
  const allTagSuggestions = useMemo(() => 
    Array.from(new Set([...globalTags, ...categories.flatMap((c: any) => c.tags ?? [])])) as string[],
    [globalTags, categories]
  );
  
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, income, expense, transfer
  const [filterPaid, setFilterPaid] = useState("all"); // all, paid, pending
  const [showFilters, setShowFilters] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ... f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), accountId: accountsData[0]?.id ?? "" });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      type: t.type as any,
      description: t.description,
      amount: String(Number(t.amount)),
      categoryId: t.categoryId ?? "",
      accountId: t.accountId,
      date: toDateInput(t.date),
      dueDate: toDateInput(t.dueDate),
      receiveDate: toDateInput(t.receiveDate),
      isPaid: t.isPaid,
      subtype: (t.subtype ?? "single") as Subtype,
      totalOccurrences: String(t.totalOccurrences ?? 2),
      notes: t.notes ?? "",
      tags: t.tags ?? [],
      location: t.location ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.description.trim()) e.description = "Descrição obrigatória";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Valor inválido";
    if (!form.date) e.date = "Data obrigatória";
    if (form.subtype === "recurring") {
      const n = Number(form.totalOccurrences);
      if (!n || n < 2 || n > 360) e.totalOccurrences = "Entre 2 e 360";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const formPayload: any = {
      type: form.type,
      description: form.description,
      amount: Number(form.amount),
      categoryId: form.categoryId || undefined,
      accountId: form.accountId,
      date: form.date,
      dueDate: form.dueDate || undefined,
      receiveDate: form.receiveDate || undefined,
      isPaid: form.isPaid,
      subtype: form.subtype,
      notes: form.notes,
      tags: form.tags,
      location: form.location,
    };
    if (form.subtype === "recurring") {
      formPayload.totalOccurrences = Number(form.totalOccurrences);
    }
    try {
      if (editingId) {
        await updateTransaction.mutateAsync({ id: editingId, ...formPayload });
        toast("Transação atualizada!");
      } else {
        await createTransaction.mutateAsync(formPayload);
        toast("Transação criada!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction.mutateAsync(deleteId);
      toast("Transação excluída.", "warning");
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const filtered = useMemo(() => {
    return transactions.filter((t: any) => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.notes ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" || t.type === filterType;
      const matchPaid =
        filterPaid === "all" ||
        (filterPaid === "paid" && t.isPaid) ||
        (filterPaid === "pending" && !t.isPaid);
      return matchSearch && matchType && matchPaid;
    });
  }, [transactions, searchTerm, filterType, filterPaid]);

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach((tx) => {
      const g = getRelativeGroupDate(tx.date);
      if (!groups[g]) groups[g] = [];
      groups[g].push(tx);
    });
    return Object.entries(groups).sort((a, b) => {
      // Sort in descending order of actual dates for correct display
      const dateA = new Date(a[1][0].date).getTime();
      const dateB = new Date(b[1][0].date).getTime();
      return dateB - dateA;
    });
  }, [filtered]);

  const totalIncome = filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const incomeCategories = categories.filter((c: any) => c.type === "income");
  const expenseCategories = categories.filter((c: any) => c.type === "expense");
  const relevantCategories =
    form.type === "income" ? incomeCategories : form.type === "expense" ? expenseCategories : [];

  const startMonthName = form.date ? getMonthName(new Date(form.date + "T12:00:00")) : "";
  const endMonthName = computeEndMonth(form.date, Number(form.totalOccurrences));

  if (txLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Sincronizando extrato...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Imersivo */}
      <div className="relative overflow-hidden pt-12 pb-24 px-8 mb-[-60px]">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 opacity-80" />
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Transações</h1>
            </div>
            <p className="text-slate-400 text-lg font-medium">Controle granular do seu fluxo de caixa.</p>
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
                onClick={openCreate}
                className="h-14 px-8 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 shadow-[0_20px_50px_rgba(99,102,241,0.3)]"
              >
                <Plus className="h-6 w-6 font-bold" />
                <span className="font-black text-sm uppercase tracking-widest">Lançar Novo</span>
              </button>
          </div>
        </div>

        {/* Dashboard de Fluxo */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-[1200px]">
           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                 <TrendingUp className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Receitas do Período</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {showBalances ? fmt(totalIncome) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold font-mono">
                 <span>{filtered.filter(t => t.type === 'income').length} ENTRADAS CONFIRMADAS</span>
              </div>
           </div>

           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-red-400">
                 <TrendingDown className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Despesas do Período</span>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {showBalances ? fmt(totalExpense) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold font-mono">
                 <span>{filtered.filter(t => t.type === 'expense').length} SAÍDAS REGISTRADAS</span>
              </div>
           </div>

           <div className="glass-card p-8 rounded-[40px] border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4 text-indigo-400">
                 <Wallet className="h-5 w-5" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em]">Resultado Final</span>
              </div>
              <p className={cn(
                "text-4xl font-black tracking-tighter tabular-nums",
                netBalance >= 0 ? "text-white" : "text-red-300"
              )}>
                {showBalances ? fmt(netBalance) : "••••••"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold font-mono">
                 <span>FLUXO LÍQUIDO NO FILTRO</span>
              </div>
           </div>
        </div>
      </div>

      {/* Extrato e Filtros */}
      <div className="px-8 pb-32">
        <div className="mb-12 flex flex-col md:flex-row items-center gap-6">
           <div className="relative group flex-1 w-full md:max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar por descrição ou notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-16 w-full rounded-[24px] border-white/20 bg-white/60 pl-16 pr-8 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 backdrop-blur-xl transition-all shadow-sm"
              />
           </div>

           <div className="flex gap-1 rounded-[24px] bg-slate-200/50 p-1.5 w-full md:w-auto overflow-hidden">
              {[
                { key: "all", label: "Geral" },
                { key: "income", label: "Entradas" },
                { key: "expense", label: "Saídas" },
                { key: "transfer", label: "Contas" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={cn("flex-1 md:px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                    filterType === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  )}
                >
                  {label}
                </button>
              ))}
           </div>

           <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-16 px-6 rounded-[24px] border-2 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest",
                showFilters ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-white bg-white/60 text-slate-400 hover:bg-white hover:text-slate-600"
              )}
            >
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
           </button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-12 overflow-hidden">
             <div className="glass-card p-8 rounded-[40px] bg-white/50 border-white/40 flex flex-wrap gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Liquidação</p>
                   <div className="flex gap-2">
                     {[{ key: "all", label: "Todos" }, { key: "paid", label: "Confirmados" }, { key: "pending", label: "Pendentes" }].map(({ key, label }) => (
                        <button key={key} onClick={() => setFilterPaid(key)}
                          className={cn("px-5 py-3 rounded-2xl text-[11px] font-black uppercase transition-all",
                            filterPaid === key ? "bg-slate-900 text-white shadow-lg" : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300"
                          )}>
                          {label}
                        </button>
                     ))}
                   </div>
                </div>
                <div className="flex-1 min-w-[200px] flex items-end justify-end">
                   <button onClick={() => { setFilterPaid("all"); setFilterType("all"); setSearchTerm(""); }} 
                     className="text-[11px] font-black text-slate-400 hover:text-red-500 flex items-center gap-2 uppercase tracking-widest transition-colors mb-2">
                      <X className="h-4 w-4" /> Limpar Tudo
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {/* Extrato Agrupado */}
        <div className="space-y-16">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400">
               <FileText className="h-20 w-20 mb-6 opacity-10" />
               <p className="text-xl font-black uppercase tracking-widest opacity-20">Nenhum registro encontrado</p>
            </div>
          ) : (
            grouped.map(([groupName, items]) => (
              <section key={groupName} className="animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6 mb-8">
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">{groupName}</h2>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((t: any) => {
                    const cat = categories.find((c: any) => c.id === t.categoryId);
                    const acc = accountsData.find((a: any) => a.id === t.accountId);
                    const isOverdue = !t.isPaid && t.dueDate && new Date(t.dueDate) < new Date();
                    const amount = Number(t.amount);
                    const isIncome = t.type === "income";
                    const subtitle = acc ? acc.name : "Carteira";

                    return (
                      <motion.div
                        key={t.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openEdit(t)}
                        className="group flex items-center gap-6 p-6 rounded-[32px] bg-white hover:bg-slate-50 border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all cursor-pointer relative overflow-hidden"
                      >
                         {/* Indicador de Status */}
                         <div className={cn(
                           "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full transition-all opacity-40 group-hover:h-20 group-hover:opacity-100",
                           isIncome ? "bg-emerald-500" : "bg-red-500"
                         )} />

                         {/* Ícone de Categoria */}
                         <div className={cn(
                           "h-16 w-16 rounded-[24px] flex items-center justify-center shadow-sm shrink-0",
                           isIncome ? "bg-emerald-50" : t.type === "transfer" ? "bg-blue-50" : "bg-red-50"
                         )}>
                            {isIncome ? <ArrowUpRight className="h-8 w-8 text-emerald-500" /> 
                              : t.type === "transfer" ? <ArrowRightLeft className="h-7 w-7 text-blue-500" />
                              : <ArrowDownRight className="h-8 w-8 text-red-500" />}
                         </div>

                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className="font-black text-slate-900 truncate tracking-tight">{t.description}</h3>
                               {t.subtype === "recurring" && (
                                  <span className="h-5 w-5 flex items-center justify-center bg-indigo-50 text-indigo-500 rounded-full scale-75">
                                    <Repeat2 className="h-3 w-3" />
                                  </span>
                               )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
                               <span className="flex items-center gap-1.5">
                                 <Wallet className="h-3 w-3" /> {subtitle}
                               </span>
                               {cat && (
                                 <>
                                   <span className="h-1 w-1 rounded-full bg-slate-200" />
                                   <span style={{ color: cat.color }}>{cat.name}</span>
                                 </>
                               )}
                            </div>
                         </div>

                         <div className="text-right">
                            <div className={cn(
                               "text-xl font-black tabular-nums tracking-tighter mb-1",
                               isIncome ? "text-emerald-600" : "text-red-600"
                            )}>
                               {isIncome ? "+" : "-"}{fmt(amount)}
                            </div>
                            <div className={cn(
                               "text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5",
                               t.isPaid ? "text-emerald-500" : isOverdue ? "text-red-500" : "text-amber-500"
                            )}>
                               {t.isPaid ? <CheckCircle2 className="h-3 w-3" /> : isOverdue ? <Plus className="h-3 w-3 rotate-45" /> : <Clock className="h-3 w-3" />}
                               <span>{t.isPaid ? "Liquidado" : isOverdue ? "Vencido" : "Previsto"}</span>
                            </div>
                         </div>

                         <div className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                             <ChevronRight className="h-6 w-6" />
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Modal Premium de Lançamento */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Ajustar Transação" : "Novo Lançamento Financeiro"}
        description="Defina os parâmetros do fluxo de caixa" size="lg">
        <div className="space-y-6 pt-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-[24px]">
             {[
                { key: "expense", label: "Despesa", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
                { key: "income", label: "Receita", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                { key: "transfer", label: "Transfer", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
             ].map(({ key, label, color, bg, border }) => (
                <button key={key} onClick={() => { set("type", key); set("categoryId", ""); }}
                  className={cn("flex-1 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all",
                    form.type === key ? cn("bg-white shadow-md", color) : "text-slate-400 hover:text-slate-600"
                  )}>
                  {label}
                </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Field label="Valor do Lançamento" required error={errors.amount}>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                    error={!!errors.amount} className="pl-14 h-16 text-2xl font-black rounded-[28px] bg-slate-50/50" />
                </div>
             </Field>
             <Field label="Data Efetiva" required error={errors.date}>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} 
                  error={!!errors.date} className="h-16 rounded-[28px] font-black uppercase text-xs" />
             </Field>
          </div>

          <Field label="O que foi?" required error={errors.description}>
             <Input placeholder="Ex: Supermercado, Aluguel, Bonus..." value={form.description}
               onChange={(e) => set("description", e.target.value)} error={!!errors.description} 
               className="h-14 rounded-2xl font-bold" />
          </Field>

          <FormRow>
            <Field label="Categoria de Destino">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="h-14 rounded-2xl font-bold">
                <option value="">Sem categoria</option>
                {relevantCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Conta Afetada">
              <Select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} className="h-14 rounded-2xl font-bold">
                {accountsData.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormDivider label="Recorrência e Prazos" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {[
                { key: "single", label: "Único", icon: FileText },
                { key: "fixed", label: "Fixo", icon: RefreshCw },
                { key: "recurring", label: "Parcelado", icon: Repeat2 },
             ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => set("subtype", key)}
                   className={cn("flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                     form.subtype === key ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-100 text-slate-400 hover:border-slate-200"
                   )}>
                   <Icon className="h-4 w-4" />
                   <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                </button>
             ))}
          </div>

          {form.subtype === "recurring" && (
            <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-6">
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Número de Parcelas</p>
                 <Input type="number" min="2" max="360" value={form.totalOccurrences}
                   onChange={(e) => set("totalOccurrences", e.target.value)} 
                   className="h-12 rounded-xl font-black bg-white" />
              </div>
              <div className="flex-1 text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fim Previsto</p>
                 <p className="text-sm font-black text-indigo-700">{endMonthName || "—"}</p>
              </div>
            </div>
          )}

          <FormRow>
            <Field label={form.type === "income" ? "Previsão de Recebimento" : "Data de Vencimento"}>
               <Input type="date" value={form.type === "income" ? form.receiveDate : form.dueDate} 
                 onChange={(e) => set(form.type === "income" ? "receiveDate" : "dueDate", e.target.value)} 
                 className="h-14 rounded-2xl" />
            </Field>
            <Field label="Local (GPS)">
               <Input placeholder="Opcional" value={form.location} onChange={(e) => set("location", e.target.value)} 
                 className="h-14 rounded-2xl" />
            </Field>
          </FormRow>

          <div className="flex items-center gap-6 p-6 rounded-3xl bg-emerald-50/30 border-2 border-emerald-100/50">
             <label className="flex cursor-pointer items-center gap-4 group">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={form.isPaid} onChange={(e) => set("isPaid", e.target.checked)}
                    className="peer sr-only" />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </div>
                <div>
                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Confirmar Liquidação</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase leading-tight font-mono">
                     {form.type === "income" ? "MARCAR COMO RECEBIDO" : "MARCAR COMO PAGO"}
                   </p>
                </div>
             </label>
          </div>

          <Field label="Tags">
            <TagInput value={form.tags} onChange={(tags) => set("tags", tags)}
              suggestions={allTagSuggestions} className="rounded-2xl"
              placeholder="Fixo, Variável, Útil..." />
          </Field>

          <Field label="Observações">
            <Textarea placeholder="Detalhes extras..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className="rounded-2xl" />
          </Field>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => setDeleteId(editingId)} className="h-14 px-6 text-red-500 font-bold rounded-2xl">
                 <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">Cancelar</Button>
            <Button onClick={save} className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all">
              {editingId ? "Salvar Alterações" : "Efetivar Lançamento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Exclusão */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Lançamento" size="sm">
        <div className="p-4 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900">Confirmar Exclusão?</h3>
                <p className="text-sm text-slate-500 mt-2">Esta operação removerá o registro permanentemente do seu histórico financeiro.</p>
             </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-xl font-bold">Voltar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 h-12 rounded-xl font-black uppercase tracking-tighter text-sm shadow-lg shadow-red-500/20">Sim, Deletar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
