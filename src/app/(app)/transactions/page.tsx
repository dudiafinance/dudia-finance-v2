"use client";

import { useState, useMemo, useEffect } from "react";
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
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const { toast } = useToast();
  
  // States para Paginação e Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<any[]>([]);

  // Hook com filtros
  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useTransactions({
    search: searchTerm,
    type: filterType,
    isPaid: filterPaid === "paid" ? "true" : filterPaid === "pending" ? "false" : undefined,
    page: page,
    limit: 50
  });

  const { data: categories = [] } = useCategories();
  const { data: accountsData = [] } = useAccounts();
  const { data: globalTags = [] } = useTags();

  // Resetar página e itens ao mudar filtros
  const resetPagination = () => {
    setPage(1);
    setAccumulatedItems([]);
  };

  // Efeito para acumular itens quando os dados chegam
  const items = txData?.items ?? [];
  const metadata = txData?.metadata;

  useEffect(() => {
    if (page === 1) {
      setAccumulatedItems(items);
    } else {
      setAccumulatedItems(prev => {
        const ids = new Set(prev.map(i => i.id));
        const newItems = items.filter(i => !ids.has(i.id));
        return [...prev, ...newItems];
      });
    }
  }, [items, page]);

  const handleLoadMore = () => {
    if (metadata?.hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  const allTagSuggestions = useMemo(() => 
    Array.from(new Set([...globalTags, ...categories.flatMap((c: any) => c.tags ?? [])])) as string[],
    [globalTags, categories]
  );
  
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

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

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    accumulatedItems.forEach((tx) => {
      const g = getRelativeGroupDate(tx.date);
      if (!groups[g]) groups[g] = [];
      groups[g].push(tx);
    });
    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].date).getTime();
      const dateB = new Date(b[1][0].date).getTime();
      return dateB - dateA;
    });
  }, [accumulatedItems]);

  const totalIncome = metadata?.totalIncome ?? 0;
  const totalExpense = metadata?.totalExpense ?? 0;
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
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando extrato...</p>
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
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Transações</h1>
            </div>
            <p className="text-slate-400 font-medium">Controle do seu fluxo de caixa.</p>
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
              onClick={openCreate}
              className="gap-3 font-bold"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Lançamento</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Receitas</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {showBalances ? fmt(totalIncome) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Acumulado filtrado</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Despesas</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {showBalances ? fmt(totalExpense) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Acumulado filtrado</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Resultado</span>
            </div>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              netBalance >= 0 ? "text-white" : "text-red-400"
            )}>
              {showBalances ? fmt(netBalance) : "••••••"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Fluxo líquido</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar transações..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPagination(); }}
              className="pl-11 h-11"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {[
              { key: "all", label: "Geral" },
              { key: "income", label: "Entradas" },
              { key: "expense", label: "Saídas" },
              { key: "transfer", label: "Transfer" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filterType === key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setFilterType(key); resetPagination(); }}
                className={cn(
                  "px-4 transition-all rounded-lg",
                  filterType === key ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {label}
              </Button>
            ))}
          </div>

          <Button
            variant={showFilters ? "soft" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2 border-slate-200 dark:border-slate-700",
              showFilters && "border-blue-200 bg-blue-50 text-blue-600"
            )}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 flex flex-wrap gap-6">
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Status</p>
                <div className="flex gap-2">
                  {[{ key: "all", label: "Todos" }, { key: "paid", label: "Confirmados" }, { key: "pending", label: "Pendentes" }].map(({ key, label }) => (
                    <Button 
                      key={key} 
                      size="sm"
                      variant={filterPaid === key ? "secondary" : "outline"}
                      onClick={() => { setFilterPaid(key); resetPagination(); }}
                      className={cn("transition-all border-slate-200 dark:border-slate-700",
                        filterPaid === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md" : "hover:bg-slate-100"
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[200px] flex items-end justify-end">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterPaid("all"); setFilterType("all"); setSearchTerm(""); resetPagination(); }} 
                  className="text-slate-400 hover:text-red-500 gap-2 font-bold"
                >
                  <X className="h-4 w-4" /> Limpar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions List */}
        <div className="space-y-8">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <FileText className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold uppercase tracking-wider opacity-50">Nenhum registro encontrado</p>
            </div>
          ) : (
            grouped.map(([groupName, items]) => (
              <section key={groupName}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">{groupName}</h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        whileHover={{ x: 4 }}
                        onClick={() => openEdit(t)}
                        className="group flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                          isIncome ? "bg-emerald-100 dark:bg-emerald-900/30" : t.type === "transfer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
                        )}>
                          {isIncome ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> 
                            : t.type === "transfer" ? <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                            : <ArrowDownRight className="h-5 w-5 text-red-600" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{t.description}</h3>
                            {t.subtype === "recurring" && (
                              <span className="h-5 w-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                                <Repeat2 className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                            <span className="flex items-center gap-1">
                              <Wallet className="h-3 w-3" /> {subtitle}
                            </span>
                            {cat && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span style={{ color: cat.color }}>{cat.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-bold tabular-nums",
                            isIncome ? "text-emerald-600" : "text-red-600"
                          )}>
                            {isIncome ? "+" : "-"}{fmt(amount)}
                          </p>
                          <p className={cn(
                            "text-xs font-medium flex items-center justify-end gap-1",
                            t.isPaid ? "text-emerald-500" : isOverdue ? "text-red-500" : "text-amber-500"
                          )}>
                            {t.isPaid ? <CheckCircle2 className="h-3 w-3" /> : isOverdue ? <Plus className="h-3 w-3 rotate-45" /> : <Clock className="h-3 w-3" />}
                            <span>{t.isPaid ? "Liquidado" : isOverdue ? "Vencido" : "Previsto"}</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
          
          {metadata?.hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                variant="outline" 
                onClick={handleLoadMore} 
                disabled={txFetching}
                className="gap-2 px-8 py-6 h-auto text-base font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              >
                {txFetching ? (
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 rotate-90" />
                )}
                <span>Carregar mais transações</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Transação" : "Nova Transação"}
        description="Defina os parâmetros da transação" size="lg">
        <div className="space-y-5 pt-2">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { key: "expense", label: "Despesa", color: "text-red-500" },
              { key: "income", label: "Receita", color: "text-emerald-500" },
              { key: "transfer", label: "Transfer", color: "text-blue-500" },
            ].map(({ key, label, color }) => (
              <Button 
                key={key} 
                variant="ghost"
                onClick={() => { set("type", key); set("categoryId", ""); }}
                className={cn("flex-1 transition-all",
                  form.type === key 
                    ? (key === "expense" ? "bg-red-500 text-white" : key === "income" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white")
                    : cn("text-slate-500", `hover:${color}`)
                )}>
                {label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Valor" required error={errors.amount}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">R$</span>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  error={!!errors.amount} className="pl-10 h-11 text-lg font-semibold rounded-md" />
              </div>
            </Field>
            <Field label="Data" required error={errors.date}>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} 
                error={!!errors.date} className="h-11 rounded-md" />
            </Field>
          </div>

          <Field label="Descrição" required error={errors.description}>
            <Input placeholder="Ex: Supermercado, Aluguel..." value={form.description}
              onChange={(e) => set("description", e.target.value)} error={!!errors.description} 
              className="h-11 rounded-md font-medium" />
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="h-11 rounded-md">
                <option value="">Sem categoria</option>
                {relevantCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Conta">
              <Select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} className="h-11 rounded-md">
                {accountsData.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormDivider label="Recorrência" />

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "single", label: "Único", icon: FileText },
              { key: "fixed", label: "Fixo", icon: RefreshCw },
              { key: "recurring", label: "Parcelado", icon: Repeat2 },
            ].map(({ key, label, icon: Icon }) => (
              <Button 
                key={key} 
                variant={form.subtype === key ? "soft" : "outline"}
                onClick={() => set("subtype", key)}
                className={cn("gap-2 h-14 border-slate-200 dark:border-slate-700",
                  form.subtype === key && "border-blue-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            ))}
          </div>

          {form.subtype === "recurring" && (
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Número de Parcelas</p>
                <Input type="number" min="2" max="360" value={form.totalOccurrences}
                  onChange={(e) => set("totalOccurrences", e.target.value)} 
                  className="h-10 rounded-md font-semibold" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-semibold text-slate-500 mb-1">Fim Previsto</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{endMonthName || "—"}</p>
              </div>
            </div>
          )}

          <FormRow>
            <Field label={form.type === "income" ? "Prev. Recebimento" : "Vencimento"}>
              <Input type="date" value={form.type === "income" ? form.receiveDate : form.dueDate} 
                onChange={(e) => set(form.type === "income" ? "receiveDate" : "dueDate", e.target.value)} 
                className="h-11 rounded-md" />
            </Field>
            <Field label="Local (GPS)">
              <Input placeholder="Opcional" value={form.location} onChange={(e) => set("location", e.target.value)} 
                className="h-11 rounded-md" />
            </Field>
          </FormRow>

          <div className="flex items-center gap-4 p-4 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={form.isPaid} onChange={(e) => set("isPaid", e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Confirmar Liquidação</p>
                <p className="text-xs text-slate-500">
                  {form.type === "income" ? "Marcar como recebido" : "Marcar como pago"}
                </p>
              </div>
            </label>
          </div>

          <Field label="Tags">
            <TagInput value={form.tags} onChange={(tags) => set("tags", tags)}
              suggestions={allTagSuggestions} className="rounded-md"
              placeholder="Fixo, Variável..." />
          </Field>

          <Field label="Observações">
            <Textarea placeholder="Detalhes extras..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className="rounded-md" />
          </Field>

          <div className="flex gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700">
            {editingId && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(editingId)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 font-bold border-slate-200">
              Cancelar
            </Button>
            <Button onClick={save} className="flex-[2] font-bold shadow-lg">
              {editingId ? "Salvar Alterações" : "Efetivar Transação"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Transação" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Confirmar Exclusão?</h3>
              <p className="text-sm text-slate-500 mt-1">Esta operação é irreversível.</p>
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
