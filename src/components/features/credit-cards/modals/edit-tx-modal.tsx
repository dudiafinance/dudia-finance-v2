"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { useCategories, useUpdateCardTransaction, useTags } from "@/hooks/use-api";
import { CreditCard, CardTransaction, CategoryItem } from "@/types/finance";

interface EditTxModalProps {
  open: boolean;
  onClose: () => void;
  tx?: CardTransaction | null;
  card?: CreditCard | null;
  onDeleteTx?: () => void;
}

type EditTxForm = { description: string; amount: string; categoryId: string; invoiceMonth: number; invoiceYear: number; tags: string[]; };

export function EditTxModal({ open, onClose, tx, card, onDeleteTx }: EditTxModalProps) {
  const [form, setForm] = useState<EditTxForm>({ description: "", amount: "", categoryId: "", invoiceMonth: 1, invoiceYear: 2024, tags: [] });
  const [updateGroup, setUpdateGroup] = useState(false);
  const originalRef = useRef({ month: 0, year: 0 });
  const updateTx = useUpdateCardTransaction(card?.id || "");
  const { data: categories = [] } = useCategories();
  const { data: allTags = [] } = useTags();

  useEffect(() => {
    if (tx && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        description: tx.description,
        amount: String(Math.abs(Number(tx.amount))),
        categoryId: tx.categoryId || "",
        invoiceMonth: tx.invoiceMonth,
        invoiceYear: tx.invoiceYear,
        tags: tx.tags || []
      });
      originalRef.current = { month: tx.invoiceMonth, year: tx.invoiceYear };
      setUpdateGroup(false);
    }
  }, [tx, open]);

  const handleMonthYearChange = (month: number, year: number) => {
    setForm((p) => ({ ...p, invoiceMonth: month, invoiceYear: year }));
    if (tx?.groupId && (month !== originalRef.current.month || year !== originalRef.current.year)) {
      setUpdateGroup(true);
    }
  };

  const handleUpdate = () => {
    if (!tx) return;
    const isRefund = Number(tx.amount) < 0;
    const amountVal = Math.abs(Number(form.amount)) * (isRefund ? -1 : 1);

    updateTx.mutate({
      id: tx.id,
      ...form,
      amount: amountVal,
      categoryId: form.categoryId || undefined,
      updateGroup
    } as unknown as Parameters<typeof updateTx.mutate>[0], { onSuccess: onClose });
  };

  const handleDelete = () => {
    if (!tx || !onDeleteTx) return;
    onDeleteTx();
  };

  if (!tx) return null;

  const isInstallment = !!tx.groupId;
  const installmentCount = tx.totalInstallments ?? 1;
  const currentInstallment = tx.currentInstallment ?? 1;
  const remainingInstallments = installmentCount - currentInstallment;

  return (
    <Modal open={open} onClose={onClose} title="Editar Lançamento" size="md">
      <div className="space-y-8 pt-4">
        {isInstallment && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="text-[11px] text-blue-400">
              <span className="font-bold">Parcela {currentInstallment}/{installmentCount}</span>
              {remainingInstallments > 0 && (
                <span> · {remainingInstallments} parcela{remainingInstallments > 1 ? "s" : ""} restante{remainingInstallments > 1 ? "s" : ""} após esta</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <Field label="Descrição">
              <Input value={form.description} onChange={e => setForm((p) => ({...p, description: e.target.value}))} className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>

            <Field label="Valor (R$)">
              <Input type="number" value={form.amount} onChange={e => setForm((p) => ({...p, amount: e.target.value}))} className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums" />
            </Field>
          </div>

          <div className="space-y-6">
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={e => setForm((p) => ({...p, categoryId: e.target.value}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                <option value="">Sem Categoria</option>
                {(categories as unknown as CategoryItem[]).filter((c) => c.type === 'expense').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Fatura de Referência">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={form.invoiceMonth}
                  onChange={e => handleMonthYearChange(Number(e.target.value), form.invoiceYear)}
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                >
                  {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </Select>
                <Input type="number" value={form.invoiceYear}
                  onChange={e => handleMonthYearChange(form.invoiceMonth, Number(e.target.value))}
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </div>
            </Field>

            <Field label="Tags de Identificação">
              <TagInput
                value={form.tags}
                onChange={(tags) => setForm(p => ({ ...p, tags }))}
                suggestions={allTags.map((t: { name: string }) => t.name)}
                className="text-xs"
                placeholder="Pressione Enter..."
              />
            </Field>
          </div>
        </div>

        {isInstallment && (
          <label className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border shadow-precision cursor-pointer transition-colors hover:bg-secondary">
            <input type="checkbox" checked={updateGroup} onChange={e => setUpdateGroup(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-zinc-700 text-foreground focus:ring-zinc-500" />
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground block">
                Aplicar em todas as parcelas seguintes
              </span>
              {updateGroup && remainingInstallments > 0 && (
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {remainingInstallments} parcela{remainingInstallments > 1 ? "s" : ""} também será{remainingInstallments === 1 ? "" : "ão"} atualizada{remainingInstallments === 1 ? "da" : "s"}
                </span>
              )}
            </div>
          </label>
        )}

        <div className="flex gap-4 pt-6 border-t border-border/50">
          <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-500/10 border-red-500/20">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
          <Button onClick={handleUpdate} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
            disabled={updateTx.isPending}>
            {updateTx.isPending ? "Salvando..." : "Confirmar Alterações"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
