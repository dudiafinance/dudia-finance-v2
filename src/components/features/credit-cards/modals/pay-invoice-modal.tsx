"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { usePayCardInvoice } from "@/hooks/use-api";
import { CreditCard, AccountItem } from "@/types/finance";

interface PayInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  card?: CreditCard | null;
  total: number;
  accounts: AccountItem[];
  month: number;
  year: number;
  fmt: (v: number) => string;
}

export function PayInvoiceModal({ open, onClose, card, total, accounts, month, year, fmt }: PayInvoiceModalProps) {
  const [form, setForm] = useState({ accountId: "", amount: String(total), date: new Date().toISOString().split('T')[0] });
  const payInvoice = usePayCardInvoice();

  const syncAmount = useCallback(() => {
    if(open) setForm(p => ({...p, amount: String(total || 0) }));
  }, [open, total]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncAmount();
  }, [syncAmount]);

  const handlePay = () => {
    if (!card) return;
    payInvoice.mutate({
      cardId: card.id,
      accountId: form.accountId,
      amount: Number(form.amount),
      description: `Pagamento fatura ${card.name}`,
      date: form.date,
      month,
      year
    }, { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title="Liquidar Fatura" size="md">
      <div className="space-y-8 pt-4">
        <div className="bg-secondary/30 rounded-xl p-8 text-center border border-border/50 shadow-precision">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Valor da Liquidação</p>
          <p className="text-4xl font-bold text-foreground tabular-nums tracking-tighter">{fmt(Number(form.amount))}</p>
        </div>

        <div className="space-y-6">
          <Field label="Conta para Débito" required>
            <Select value={form.accountId} onChange={e => setForm(p => ({...p, accountId: e.target.value}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
              <option value="">Selecione...</option>
              {accounts.filter((a) => a.type !== 'credit_card').map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({fmt(Number(acc.balance))})</option>
              ))}
            </Select>
          </Field>

          <Field label="Data do Pagamento">
            <Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
          </Field>
        </div>

        <div className="flex gap-4 pt-6 border-t border-border/50">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
          <Button onClick={handlePay} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
            disabled={!form.accountId || payInvoice.isPending}>
            {payInvoice.isPending ? "Processando..." : "Confirmar Liquidação"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
