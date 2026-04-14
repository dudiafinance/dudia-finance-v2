"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { useCategories, useUpdateCardTransaction } from "@/hooks/use-api";
import { CreditCard, CardTransaction, CategoryItem } from "@/types/finance";

interface EditTxModalProps {
  open: boolean;
  onClose: () => void;
  tx?: CardTransaction | null;
  card?: CreditCard | null;
  onDeleteTx?: () => void;
}

type EditTxForm = { description: string; amount: string; categoryId: string; invoiceMonth: number; invoiceYear: number; };

export function EditTxModal({ open, onClose, tx, card, onDeleteTx }: EditTxModalProps) {
  const [form, setForm] = useState<EditTxForm>({ description: "", amount: "", categoryId: "", invoiceMonth: 1, invoiceYear: 2024 });
  const [updateGroup, setUpdateGroup] = useState(false);
  const updateTx = useUpdateCardTransaction(card?.id || "");
  const { data: categories = [] } = useCategories();

  const initializeForm = useCallback(() => {
    if (tx && open) {
      setForm({
        description: tx.description, 
        amount: String(Math.abs(Number(tx.amount))), 
        categoryId: tx.categoryId || "",
        invoiceMonth: tx.invoiceMonth,
        invoiceYear: tx.invoiceYear
      });
      setUpdateGroup(false);
    }
  }, [tx, open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeForm();
  }, [initializeForm]);

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

  return (
    <Modal open={open} onClose={onClose} title="Editar Lançamento" size="md">
      <div className="space-y-8 pt-4">
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
                <Select value={form.invoiceMonth} onChange={e => setForm((p) => ({...p, invoiceMonth: Number(e.target.value)}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                  {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </Select>
                <Input type="number" value={form.invoiceYear} onChange={e => setForm((p) => ({...p, invoiceYear: Number(e.target.value)}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
              </div>
            </Field>
          </div>
        </div>

        {tx.groupId && (
          <label className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border shadow-precision cursor-pointer transition-colors hover:bg-secondary">
            <input type="checkbox" checked={updateGroup} onChange={e => setUpdateGroup(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-foreground focus:ring-zinc-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Aplicar em todas as parcelas seguintes
            </span>
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
