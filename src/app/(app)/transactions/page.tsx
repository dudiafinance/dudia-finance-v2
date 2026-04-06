"use client";

import { useState } from "react";
import {
  Search, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Edit, Trash2, Calendar, CheckCircle2, Clock, Filter, X, ChevronDown,
  RefreshCw, Repeat2,
} from "lucide-react";
import { useTransactions, useCategories, useAccounts, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea, FormRow, FormDivider } from "@/components/ui/form-field";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

export default function TransactionsPage() {
  const { toast } = useToast();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accountsData = [] } = useAccounts();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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

  const filtered = transactions.filter((t: any) => {
    const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    const matchPaid =
      filterPaid === "all" ||
      (filterPaid === "paid" && t.isPaid) ||
      (filterPaid === "pending" && !t.isPaid);
    return matchSearch && matchType && matchPaid;
  });

  const totalIncome = filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const incomeCategories = categories.filter((c: any) => c.type === "income");
  const expenseCategories = categories.filter((c: any) => c.type === "expense");
  const relevantCategories =
    form.type === "income" ? incomeCategories : form.type === "expense" ? expenseCategories : [];

  const startMonthName = form.date ? getMonthName(new Date(form.date + "T12:00:00")) : "";
  const endMonthName = computeEndMonth(form.date, Number(form.totalOccurrences));

  if (txLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transações</h1>
          <p className="text-sm text-slate-500">{filtered.length} encontradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Receitas", value: totalIncome, pos: true },
          { label: "Despesas", value: totalExpense, pos: false },
          { label: "Saldo", value: balance, pos: balance >= 0 },
        ].map(({ label, value, pos }) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={cn("text-xl font-bold mt-1", pos ? "text-emerald-600" : "text-red-600")}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
              showFilters ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
          </button>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {[
            { key: "all", label: "Todas" },
            { key: "income", label: "Receitas" },
            { key: "expense", label: "Despesas" },
            { key: "transfer", label: "Transferências" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                filterType === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-sm font-medium text-slate-600">Status:</span>
            {[{ key: "all", label: "Todos" }, { key: "paid", label: "Pago" }, { key: "pending", label: "Pendente" }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterPaid(key)}
                className={cn("rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                  filterPaid === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
            {filterPaid !== "all" && (
              <button onClick={() => setFilterPaid("all")} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Descrição</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Categoria</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Vencimento</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Valor</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((t: any) => {
                  const cat = categories.find((c: any) => c.id === t.categoryId);
                  const acc = accountsData.find((a: any) => a.id === t.accountId);
                  const isOverdue = !t.isPaid && t.dueDate && new Date(t.dueDate) < new Date();
                  const amount = Number(t.amount);
                  const subtype = t.subtype ?? "single";
                  return (
                    <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            t.type === "income" ? "bg-emerald-100" : t.type === "transfer" ? "bg-blue-100" : "bg-red-100"
                          )}>
                            {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                              : t.type === "transfer" ? <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                              : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-slate-900">{t.description}</p>
                              {subtype === "fixed" && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  <RefreshCw className="h-2.5 w-2.5" /> Fixo
                                </span>
                              )}
                              {subtype === "recurring" && t.currentOccurrence && t.totalOccurrences && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-600">
                                  <Repeat2 className="h-2.5 w-2.5" /> {t.currentOccurrence}/{t.totalOccurrences}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {acc && <p className="text-xs text-slate-400">{acc.name}</p>}
                              {(t.tags ?? []).slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-xs text-slate-400">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {cat && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                            {cat.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {t.type === "expense" && t.dueDate ? (
                          <span className={cn("text-xs font-medium", isOverdue ? "text-red-600" : "text-slate-500")}>
                            {isOverdue && "⚠ "}{new Date(t.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        ) : t.type === "income" && t.receiveDate ? (
                          <span className="text-xs text-slate-500">
                            {new Date(t.receiveDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          t.isPaid ? "bg-emerald-100 text-emerald-700"
                            : isOverdue ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {t.isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {t.isPaid ? "Pago" : isOverdue ? "Vencido" : "Pendente"}
                        </span>
                      </td>
                      <td className={cn("whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold",
                        t.type === "income" ? "text-emerald-600" : "text-red-600"
                      )}>
                        {t.type === "income" ? "+" : "-"}{fmt(amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(t)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(t.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Transação" : "Nova Transação"}
        description="Preencha os dados da transação" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo *</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "income", label: "Receita" },
                { key: "expense", label: "Despesa" },
                { key: "transfer", label: "Transferência" },
              ] as const).map(({ key, label }) => (
                <button key={key} type="button" onClick={() => { set("type", key); set("categoryId", ""); }}
                  className={cn("rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                    form.type === key
                      ? key === "income" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : key === "expense" ? "border-red-500 bg-red-50 text-red-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FormRow>
            <Field label="Valor" required error={errors.amount}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  error={!!errors.amount} className="pl-9" />
              </div>
            </Field>
            <Field label="Data" required error={errors.date}>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} error={!!errors.date} />
            </Field>
          </FormRow>

          <Field label="Descrição" required error={errors.description}>
            <Input placeholder="Ex: Supermercado, Salário..." value={form.description}
              onChange={(e) => set("description", e.target.value)} error={!!errors.description} />
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sem categoria</option>
                {relevantCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Conta">
              <Select value={form.accountId} onChange={(e) => set("accountId", e.target.value)}>
                {accountsData.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormDivider label="Recorrência" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Lançamento</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "single" as Subtype, label: "Único", desc: "Ocorre uma vez" },
                { key: "fixed" as Subtype, label: "Fixo", desc: "Mensal, sem fim" },
                { key: "recurring" as Subtype, label: "Recorrente", desc: "N parcelas" },
              ]).map(({ key, label, desc }) => (
                <button key={key} type="button" onClick={() => set("subtype", key)}
                  className={cn("rounded-lg border-2 py-2.5 px-3 text-left transition-all",
                    form.subtype === key
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}>
                  <p className={cn("text-sm font-medium", form.subtype === key ? "text-violet-700" : "text-slate-700")}>{label}</p>
                  <p className={cn("text-xs mt-0.5", form.subtype === key ? "text-violet-500" : "text-slate-400")}>{desc}</p>
                </button>
              ))}
            </div>

            {form.subtype === "fixed" && (
              <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Este lançamento irá aparecer em todos os meses futuros nas previsões
              </p>
            )}

            {form.subtype === "recurring" && (
              <div className="mt-3 space-y-2">
                <Field label="Número de parcelas" error={errors.totalOccurrences}>
                  <Input type="number" min="2" max="360"
                    value={form.totalOccurrences}
                    onChange={(e) => set("totalOccurrences", e.target.value)}
                    error={!!errors.totalOccurrences} />
                </Field>
                {startMonthName && endMonthName && (
                  <p className="text-xs text-slate-500">
                    Será criado de <span className="font-medium text-slate-700">{startMonthName}</span> a <span className="font-medium text-slate-700">{endMonthName}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <FormDivider label="Datas" />

          <FormRow>
            {form.type === "expense" ? (
              <Field label="Data de Vencimento">
                <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </Field>
            ) : form.type === "income" ? (
              <Field label="Data de Recebimento">
                <Input type="date" value={form.receiveDate} onChange={(e) => set("receiveDate", e.target.value)} />
              </Field>
            ) : <div />}
            <Field label="Localização">
              <Input placeholder="Opcional" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
          </FormRow>

          <FormDivider label="Opções" />

          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.isPaid} onChange={(e) => set("isPaid", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
              <span className="text-sm text-slate-700">{form.type === "income" ? "Já recebido" : "Já pago"}</span>
            </label>
          </div>

          <Field label="Tags">
            <TagInput value={form.tags} onChange={(tags) => set("tags", tags)}
              placeholder="fixo, mensal, necessário... (Enter para adicionar)" />
          </Field>

          <Field label="Observações">
            <Textarea placeholder="Informações adicionais..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Salvar Alterações" : "Criar Transação"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Transação" size="sm">
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
