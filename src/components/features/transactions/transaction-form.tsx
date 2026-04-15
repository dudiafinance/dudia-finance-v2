"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, FormDivider } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TagInput } from "@/components/ui/tag-input";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-api";

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

type CategoryItem = { id: string; name: string; type: string; color?: string; tags?: string[] };
type AccountItem = { id: string; name: string; balance?: number | string };
type TagItem = { id: string; name: string };
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
  recurringGroupId?: string | null;
  totalOccurrences?: number | null;
  notes?: string | null;
  tags?: string[];
  location?: string | null;
};

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  categories: CategoryItem[];
  accounts: AccountItem[];
  globalTags: TagItem[];
  userCurrency: string;
  onClose: () => void;
  onSaved: () => void;
  onSaveAndContinue?: () => void;
}

const emptyForm = (defaultAccountId = ""): FormData => ({
  type: "expense",
  description: "",
  amount: "",
  categoryId: "",
  accountId: defaultAccountId,
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

const toDateInput = (d?: string | null) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

export function TransactionForm({
  editingTransaction,
  categories,
  accounts,
  globalTags,
  userCurrency,
  onClose,
  onSaved,
  onSaveAndContinue,
}: TransactionFormProps) {
  const { toast } = useToast();

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [form, setForm] = useState<FormData>(
    editingTransaction
      ? {
          type: editingTransaction.type as "income" | "expense" | "transfer",
          description: editingTransaction.description,
          amount: String(Number(editingTransaction.amount)),
          categoryId: editingTransaction.categoryId ?? "",
          accountId: editingTransaction.accountId,
          date: toDateInput(editingTransaction.date),
          dueDate: toDateInput(editingTransaction.dueDate),
          receiveDate: toDateInput(editingTransaction.receiveDate),
          isPaid: editingTransaction.isPaid,
          subtype: (editingTransaction.subtype ?? "single") as Subtype,
          totalOccurrences: String(editingTransaction.totalOccurrences ?? 2),
          notes: editingTransaction.notes ?? "",
          tags: editingTransaction.tags ?? [],
          location: editingTransaction.location ?? "",
        }
      : emptyForm(accounts[0]?.id ?? "")
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');

  const set = (key: keyof FormData, value: string | boolean | string[]) => {
    setForm((f) => ({ ... f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
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

  const save = async (continueMode = false) => {
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
      if (editingTransaction) {
        await updateTransaction.mutateAsync({ id: editingTransaction.id, ...formPayload });
        toast("Transação atualizada!");
        onSaved();
      } else {
        await createTransaction.mutateAsync(formPayload);
        toast("Transação criada!");
        if (continueMode && onSaveAndContinue) {
          onSaveAndContinue();
        } else {
          onSaved();
        }
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction.mutateAsync({ id: deleteId, mode: deleteMode });
      toast("Transação excluída.", "warning");
      onSaved();
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
    setDeleteMode('single');
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const relevantCategories =
    form.type === "income" ? incomeCategories : form.type === "expense" ? expenseCategories : [];

  const allTagSuggestions = Array.from(new Set([
    ...globalTags.map((t) => t.name),
    ...categories.flatMap((c) => c.tags ?? [])
  ])) as string[];

  const endMonthName = computeEndMonth(form.date, Number(form.totalOccurrences));

  return (
    <>
      <div className="space-y-8 pt-4">
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
                    onClick={() => { set("type", key as FormData["type"]); set("categoryId", ""); }}
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
                {accounts.map((a) => (
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
                {form.isPaid ? (
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
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
                    onClick={() => set("subtype", key as Subtype)}
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
          {editingTransaction && (
            <Button type="button" variant="outline" size="icon" onClick={() => setDeleteId(editingTransaction.id)} className="text-red-500 hover:bg-red-500/10 border-red-500/20">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="flex-1 text-muted-foreground font-bold uppercase text-[11px] tracking-widest">
            Cancelar
          </Button>
          {!editingTransaction && onSaveAndContinue && (
            <Button
              variant="secondary"
              onClick={() => save(true)}
              className="flex-[1] font-bold uppercase text-[10px] tracking-widest py-6"
              disabled={createTransaction.isPending || updateTransaction.isPending}
            >
              {createTransaction.isPending ? "Salvando..." : "Salvar + Novo"}
            </Button>
          )}
          <Button
            onClick={() => save(false)}
            className="flex-[2] font-bold uppercase text-[11px] tracking-widest py-6"
            disabled={createTransaction.isPending || updateTransaction.isPending}
          >
            {createTransaction.isPending || updateTransaction.isPending ? "Salvando..." : (editingTransaction ? "Salvar Alterações" : "Efetivar Lançamento")}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleteMode('single'); }}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        description={deleteId === editingTransaction?.id && editingTransaction?.recurringGroupId != null
          ? "Esta transação faz parte de um lançamento recorrente. Deseja excluir apenas esta ocorrência ou todas?"
          : "Esta operação removerá o registro permanentemente do seu fluxo de caixa."}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteTransaction.isPending}
      />
    </>
  );
}
