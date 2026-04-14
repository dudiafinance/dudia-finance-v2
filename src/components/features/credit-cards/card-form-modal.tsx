"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useCreateCreditCard, useUpdateCreditCard, useDeleteCreditCard } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { CreditCard, GRADIENT_PRESETS, NetworkType } from "@/types/finance";

interface CardFormModalProps {
  open: boolean;
  onClose: () => void;
  editingCard?: CreditCard | null;
  onDelete?: (id: string) => void;
}

export function CardFormModal({ open, onClose, editingCard, onDelete }: CardFormModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<{
    name: string; bank: string; lastDigits: string; limit: string;
    dueDay: string; closingDay: string; gradient: string; color: string; network: NetworkType;
  }>({
    name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
    gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();
  const deleteCard = useDeleteCreditCard();

  const initializeForm = useCallback(() => {
    if (editingCard && open) {
      const normalizedGradient = editingCard.gradient?.includes('bg-gradient') 
        ? editingCard.gradient 
        : editingCard.gradient?.startsWith('from-') 
          ? `bg-gradient-to-br ${editingCard.gradient}` 
          : GRADIENT_PRESETS[0].value;
      setForm({
        name: editingCard.name, 
        bank: editingCard.bank, 
        lastDigits: editingCard.lastDigits || "", 
        limit: String(editingCard.limit), 
        dueDay: String(editingCard.dueDay), 
        closingDay: String(editingCard.closingDay),
        gradient: normalizedGradient, 
        color: editingCard.color || GRADIENT_PRESETS[0].color, 
        network: (editingCard.network || "mastercard") as NetworkType
      });
    } else if (open) {
      setForm({
        name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
        gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
      });
    }
  }, [editingCard, open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeForm();
  }, [initializeForm]);

  const handleSubmit = () => {
    const payload = { ...form, limit: Number(form.limit), dueDay: Number(form.dueDay), closingDay: Number(form.closingDay) };
    if (editingCard) {
      updateCard.mutate({ id: editingCard.id, ...payload }, {
        onSuccess: () => {
          toast("Cartão atualizado!");
          onClose();
        },
        onError: (err) => {
          toast(err instanceof Error ? err.message : "Erro ao atualizar", "error");
        }
      });
    } else {
      createCard.mutate(payload, {
        onSuccess: () => {
          toast("Cartão criado!");
          onClose();
        },
        onError: (err) => {
          toast(err instanceof Error ? err.message : "Erro ao criar", "error");
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!editingCard || !onDelete) return;
    onDelete(editingCard.id);
    setDeleteId(null);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={editingCard ? "Editar Cartão" : "Novo Cartão"} size="md">
        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Instituição Bancária">
              <Input value={form.bank} onChange={e => setForm(p => ({...p, bank: e.target.value}))} 
                placeholder="Ex: Nubank, Inter" className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>
            <Field label="Identificador do Cartão">
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} 
                placeholder="Ex: Cartão Principal" className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Últimos 4 Dígitos">
              <Input maxLength={4} value={form.lastDigits} onChange={e => setForm(p => ({...p, lastDigits: e.target.value}))} 
                placeholder="1234" className="h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums text-center" />
            </Field>
            <Field label="Limite Operacional">
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                <Input type="number" value={form.limit} onChange={e => setForm(p => ({...p, limit: e.target.value}))} 
                  placeholder="5000.00" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Dia de Vencimento">
              <Input type="number" value={form.dueDay} onChange={e => setForm(p => ({...p, dueDay: e.target.value}))} 
                className="h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground text-center" />
            </Field>
            <Field label="Dia de Fechamento">
              <Input type="number" value={form.closingDay} onChange={e => setForm(p => ({...p, closingDay: e.target.value}))} 
                className="h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground text-center" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Bandeira">
              <Select value={form.network} onChange={e => setForm(p => ({...p, network: e.target.value as NetworkType}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground uppercase font-bold tracking-widest">
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="hipercard">Hipercard</option>
              </Select>
            </Field>
            <Field label="Estilo Visual">
              <div className="flex gap-2 p-2 bg-secondary/50 rounded-lg border border-border/50 shadow-precision">
                {GRADIENT_PRESETS.map(preset => {
                  const isSelected = form.gradient === preset.value;
                  return (
                    <button 
                      key={preset.value}
                      type="button"
                      onClick={() => setForm(p => ({...p, gradient: preset.value, color: preset.color}))}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full overflow-hidden transition-all border border-white/10 shadow-precision",
                        preset.value,
                        isSelected ? "ring-1 ring-foreground scale-110 shadow-lg" : "opacity-40 hover:opacity-100"
                      )}
                    />
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
              disabled={createCard.isPending || updateCard.isPending}>
              {createCard.isPending || updateCard.isPending ? "Salvando..." : "Salvar Cartão"}
            </Button>
          </div>
        </div>
      </Modal>

      <AlertDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cartão"
        description="Todas as transações vinculadas a este cartão serão perdidas. Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteCard.isPending}
      />
    </>
  );
}
