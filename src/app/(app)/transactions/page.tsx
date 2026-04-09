"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Trash2, CheckCircle2, Clock, Filter, X,
  RefreshCw, Repeat2, TrendingUp, TrendingDown, Wallet, Eye, EyeOff,
  FileText, ArrowRight
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

type Transaction = {
  id: string;
  type: string;
  description: string;
  amount: number | string;
  categoryId?: string | null;
  accountId: string;
  date: string;
  dueDate?: string | null;
  receiveDate?: string | null;
  isPaid: boolean;
  subtype?: string;
  totalOccurrences?: number | null;
  notes?: string | null;
  tags?: string[];
  location?: string | null;
};

type CategoryItem = { id: string; name: string; type: string; color?: string; tags?: string[] };
type AccountItem = { id: string; name: string; balance?: number | string };
type TagItem = { id: string; name: string };

const toDateInput = (d?: string | null) =>
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
  const [accumulatedItems, setAccumulatedItems] = useState<Transaction[]>([]);

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
  const items = (txData?.items ?? []) as unknown as Transaction[];
  const metadata = txData?.metadata;
  const itemsKey = useMemo(() => JSON.stringify(items.map(i => i.id)), [items]);

  useEffect(() => {
    setAccumulatedItems(prev => {
      if (page === 1) return items;
      const ids = new Set(prev.map(i => i.id));
      const newItems = items.filter(i => !ids.has(i.id));
      return [...prev, ...newItems];
    });// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, page]);

  const handleLoadMore = () => {
    if (metadata?.hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  const typedGlobalTags = globalTags as unknown as TagItem[];
  const typedCategories = categories as unknown as CategoryItem[];
  const typedAccounts = accountsData as unknown as AccountItem[];

  const allTagSuggestions = useMemo(() =>
    Array.from(new Set([
      ...typedGlobalTags.map((t) => t.name),
      ...typedCategories.flatMap((c) => c.tags ?? [])
    ])) as string[],
    [typedGlobalTags, typedCategories]
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

  const set = (key: keyof FormData, value: string | boolean | string[]) => {
    setForm((f) => ({ ... f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), accountId: typedAccounts[0]?.id ?? "" });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({
      type: t.type as "income" | "expense" | "transfer",
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
    const formPayload: Record<string, unknown> = {
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
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
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
    const groups: Record<string, Transaction[]> = {};
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

  const incomeCategories = typedCategories.filter((c) => c.type === "income");
  const expenseCategories = typedCategories.filter((c) => c.type === "expense");
  const relevantCategories =
    form.type === "income" ? incomeCategories : form.type === "expense" ? expenseCategories : [];

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
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gestão de Fluxo</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Transações</h1>
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
              onClick={openCreate}
              className="gap-2 h-8 text-[11px] font-bold uppercase"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Lançamento</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Receitas
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalIncome) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Despesas
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalExpense) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Wallet className="h-3 w-3 text-foreground" />
              Resultado
            </p>
            <p className={cn(
              "text-xl font-bold tabular-nums",
              netBalance >= 0 ? "text-foreground" : "text-red-500"
            )}>
              {showBalances ? fmt(netBalance) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPagination(); }}
              className="pl-10 h-10 text-[13px] bg-secondary/30 border-border focus:bg-background shadow-precision"
            />
          </div>

          <div className="flex gap-1 rounded-lg bg-secondary p-1 border border-border shadow-precision">
            {[
              { key: "all", label: "Geral" },
              { key: "income", label: "Entradas" },
              { key: "expense", label: "Saídas" },
              { key: "transfer", label: "Transf." },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filterType === key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setFilterType(key); resetPagination(); }}
                className={cn(
                  "h-7 px-4 transition-all rounded text-[11px] font-bold uppercase",
                  filterType === key ? "bg-background text-foreground shadow-precision border-precision border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Button>
            ))}
          </div>

          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2 h-10 border-border shadow-precision text-[11px] font-bold uppercase",
              showFilters && "bg-secondary"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filtros</span>
          </Button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-8 overflow-hidden">
            <div className="bg-secondary/20 rounded-lg border border-border/50 p-5 flex flex-wrap gap-6 shadow-precision">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Liquidação</p>
                <div className="flex gap-2">
                  {[{ key: "all", label: "Todos" }, { key: "paid", label: "Confirmados" }, { key: "pending", label: "Pendentes" }].map(({ key, label }) => (
                    <Button 
                      key={key} 
                      size="sm"
                      variant={filterPaid === key ? "default" : "outline"}
                      onClick={() => { setFilterPaid(key); resetPagination(); }}
                      className={cn("h-8 px-4 text-[10px] font-bold uppercase rounded border-border transition-all",
                        filterPaid === key ? "shadow-precision" : "bg-background hover:bg-secondary"
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
                  className="text-muted-foreground hover:text-red-500 gap-2 font-bold uppercase text-[10px]"
                >
                  <X className="h-3.5 w-3.5" /> Limpar Filtros
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions List */}
        <div className="space-y-10">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <FileText className="h-12 w-12 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum registro</p>
            </div>
          ) : (
            grouped.map(([groupName, items]) => (
              <section key={groupName}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{groupName}</h2>
                  <div className="h-px flex-1 bg-border/40" />
                </div>

                <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/50">
                  {items.map((t) => {
                    const cat = typedCategories.find((c) => c.id === t.categoryId);
                    const acc = typedAccounts.find((a) => a.id === t.accountId);
                    const isOverdue = !t.isPaid && t.dueDate && new Date(t.dueDate) < new Date();
                    const amount = Number(t.amount);
                    const isIncome = t.type === "income";
                    const subtitle = acc ? acc.name : "Carteira";

                    return (
                      <motion.div
                        key={t.id}
                        onClick={() => openEdit(t)}
                        className="group flex items-center gap-4 p-4 bg-background hover:bg-secondary/30 transition-all cursor-pointer"
                      >
                        <div className={cn(
                          "h-8 w-8 rounded flex items-center justify-center shrink-0 border border-border/50",
                          isIncome ? "text-emerald-500" : t.type === "transfer" ? "text-foreground" : "text-foreground"
                        )}>
                          {isIncome ? <ArrowUpRight className="h-4 w-4" /> 
                            : t.type === "transfer" ? <ArrowRightLeft className="h-4 w-4" />
                            : <ArrowDownRight className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-bold text-foreground truncate tracking-tight">{t.description}</h3>
                            {t.subtype === "recurring" && (
                              <span className="text-[9px] font-bold uppercase text-muted-foreground border border-border px-1 rounded">Parcelado</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                            <span className="flex items-center gap-1">
                               {subtitle}
                            </span>
                            {cat && (
                              <>
                                <span>•</span>
                                <span style={{ color: cat.color }}>{cat.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold tabular-nums tracking-tight",
                            isIncome ? "text-emerald-500" : "text-foreground"
                          )}>
                            {isIncome ? "+" : "-"}{fmt(amount)}
                          </p>
                          <div className={cn(
                            "text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1",
                            t.isPaid ? "text-emerald-500" : isOverdue ? "text-red-500" : "text-amber-500"
                          )}>
                            {t.isPaid ? "Liquidado" : isOverdue ? "Vencido" : "Previsto"}
                          </div>
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
                className="gap-2 px-12 h-11 text-[11px] font-bold uppercase tracking-widest transition-all shadow-precision border-border hover:bg-secondary"
              >
                {txFetching ? (
                  <div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 rotate-90" />
                )}
                <span>Carregar mais transações</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Lançamento" : "Novo Lançamento"}
        description={editingId ? "Ajuste os detalhes deste registro" : "Informe os dados para o novo registro"} size="lg">
        <div className="space-y-8 pt-4">
          
          {/* Hero Amount Section */}
          <div className="flex flex-col items-center justify-center py-8 bg-secondary/30 rounded-xl border border-border/50 shadow-precision">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Valor do Lançamento</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-light text-muted-foreground">R$</span>
              <input 
                type="number" 
                step="0.01" 
                value={form.amount} 
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0,00"
                autoFocus
                className="bg-transparent text-6xl font-bold tracking-tighter text-foreground focus:outline-none w-full max-w-[300px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
              />
            </div>
            {errors.amount && <p className="text-[10px] font-bold text-red-500 uppercase mt-3 tracking-widest">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <Field label="Tipo de Fluxo" required>
                <div className="flex gap-1 p-1 bg-secondary rounded-md border border-border">
                  {[
                    { key: "expense", label: "Saída" },
                    { key: "income", label: "Entrada" },
                    { key: "transfer", label: "Transf." },
                  ].map(({ key, label }) => (
                    <button 
                      key={key} 
                      type="button"
                      onClick={() => { set("type", key as any); set("categoryId", ""); }}
                      className={cn("flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all",
                        form.type === key 
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground")}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Descrição Principal" required error={errors.description}>
                <Input placeholder="Ex: Assinatura Software" value={form.description}
                  onChange={(e) => set("description", e.target.value)} error={!!errors.description} 
                  className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
              </Field>

              <Field label="Categoria de Gasto">
                <SearchableSelect 
                  options={relevantCategories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                  value={form.categoryId}
                  onChange={val => set("categoryId", val)}
                  placeholder="Selecione..."
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Data da Operação" required error={errors.date}>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} 
                  error={!!errors.date} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </Field>

              <Field label="Conta de Origem/Destino">
                <Select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                  {typedAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </Field>

              <div className="pt-2">
                <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={form.isPaid} onChange={(e) => set("isPaid", e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-foreground focus:ring-zinc-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Confirmar Liquidação</span>
                  </div>
                  {form.isPaid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                </div>
              </div>
            </div>
          </div>

          <FormDivider label="Informações Complementares" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Field label="Tipo de Recorrência">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "single", label: "Único" },
                    { key: "fixed", label: "Fixo" },
                    { key: "recurring", label: "Parcelas" },
                  ].map(({ key, label }) => (
                    <button 
                      key={key} 
                      type="button"
                      onClick={() => set("subtype", key as any)}
                      className={cn("py-2 text-[10px] font-bold uppercase border rounded-md transition-all",
                        form.subtype === key ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:border-muted-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              {form.subtype === "recurring" && (
                <div className="flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex-1">
                    <Field label="Qtd. Parcelas">
                      <Input type="number" min="2" max="360" value={form.totalOccurrences}
                        onChange={(e) => set("totalOccurrences", e.target.value)} 
                        className="h-9 text-xs border-zinc-200 dark:border-zinc-800" />
                    </Field>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Término</p>
                    <p className="text-xs font-bold text-foreground">{endMonthName || "—"}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Field label="Tags de Identificação">
                <TagInput value={form.tags} onChange={(tags) => set("tags", tags)}
                  suggestions={allTagSuggestions} className="text-xs"
                  placeholder="Pressione Enter..." />
              </Field>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            {editingId && (
              <Button type="button" variant="outline" size="icon" onClick={() => setDeleteId(editingId)} className="text-red-500 hover:bg-red-500/10 border-red-500/20">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-muted-foreground font-bold uppercase text-[11px] tracking-widest">
              Cancelar
            </Button>
            <Button onClick={save} className="flex-[2] font-bold uppercase text-[11px] tracking-widest py-6">
              {editingId ? "Salvar Alterações" : "Efetivar Lançamento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Transação" size="sm">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Confirmar Exclusão?</h3>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">Esta operação removerá o registro permanentemente do seu fluxo de caixa.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
