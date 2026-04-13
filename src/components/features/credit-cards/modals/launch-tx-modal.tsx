"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useCategories, useCreateCardTransaction } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CreditCard, CategoryItem, getSuggestedInvoice } from "@/types/finance";

interface LaunchTxModalProps {
  open: boolean;
  onClose: () => void;
  selectedCard?: CreditCard | null;
  currentMonth: number;
  currentYear: number;
}

export function LaunchTxModal({ open, onClose, selectedCard, currentMonth, currentYear }: LaunchTxModalProps) {
  const [form, setForm] = useState({
    description: "", amount: "", type: "purchase", date: new Date().toISOString().split('T')[0],
    categoryId: "", launchType: "single", totalInstallments: "2", startInstallment: "1", isPending: false,
    invoiceMonth: currentMonth, invoiceYear: currentYear,
    amountMode: "total" as "total" | "installment",
    tags: [] as string[]
  });

  const { data: categories = [] } = useCategories();
  const createTx = useCreateCardTransaction(selectedCard?.id || "");

  const handleDateChange = (date: string) => {
    const suggested = getSuggestedInvoice(selectedCard, date);
    setForm(p => ({ ...p, date, invoiceMonth: suggested.month, invoiceYear: suggested.year }));
  };

  const expenseCategories = (categories as unknown as CategoryItem[]).filter((c) => c.type === 'expense');

  const calculatedTotal = useMemo(() => {
    if (form.amountMode === "total") return Number(form.amount) || 0;
    const n = Number(form.totalInstallments) || 1;
    const p = Number(form.amount) || 0;
    return n * p;
  }, [form.amount, form.totalInstallments, form.amountMode]);

  const handleSubmit = () => {
    const isRefund = form.type === 'refund';
    const amountVal = Math.abs(calculatedTotal) * (isRefund ? -1 : 1);
    
    createTx.mutate({
      ...form,
      amount: amountVal,
      categoryId: form.categoryId || undefined,
    } as unknown as Parameters<typeof createTx.mutate>[0], { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Lançamento" size="lg">
      <div className="space-y-8 pt-4">
        <div className="flex flex-col items-center justify-center py-8 bg-secondary/30 rounded-xl border border-border/50 shadow-precision">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {form.amountMode === 'total' ? "Valor Total" : "Valor da Parcela"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-light text-muted-foreground">R$</span>
            <input 
              type="number" 
              step="0.01" 
              value={form.amount} 
              onChange={e => setForm(p => ({...p, amount: e.target.value}))}
              placeholder="0,00"
              autoFocus
              className="bg-transparent text-6xl font-bold tracking-tighter text-foreground focus:outline-none w-full max-w-[300px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
            />
          </div>
          {form.amountMode === 'installment' && form.amount && (
            <p className="text-[10px] font-bold text-emerald-500 uppercase mt-3 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Custo Total: {formatCurrency(calculatedTotal, "BRL")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <Field label="Tipo de Operação">
              <div className="flex gap-1 p-1 bg-secondary rounded-md border border-border shadow-precision">
                {[
                  { key: "purchase", label: "Compra" },
                  { key: "refund", label: "Estorno" },
                ].map(({ key, label }) => (
                  <button 
                    key={key} 
                    type="button"
                    onClick={() => setForm(p => ({...p, type: key}))}
                    className={cn("flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all",
                      form.type === key 
                        ? "bg-background text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Descrição" required>
              <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Ex: Assinatura Software" className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>

            <Field label="Categoria">
              <SearchableSelect 
                options={expenseCategories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                value={form.categoryId}
                onChange={val => setForm(p => ({...p, categoryId: val}))}
                placeholder="Selecione..."
                className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
              />
            </Field>
          </div>

          <div className="space-y-6">
            <Field label="Data da Compra">
              <Input type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
            </Field>

            <Field label="Ciclo da Fatura">
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  value={form.invoiceMonth} 
                  onChange={e => setForm(p => ({...p, invoiceMonth: Number(e.target.value)}))} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                >
                  {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </Select>
                <Input 
                  type="number" 
                  value={form.invoiceYear} 
                  onChange={e => setForm(p => ({...p, invoiceYear: Number(e.target.value)}))} 
                  className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" 
                />
              </div>
            </Field>

            <Field label="Forma de Pagamento">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setForm(p => ({...p, launchType: "single"}))}
                  className={cn("py-2 text-[10px] font-bold uppercase border rounded transition-all",
                    form.launchType === "single" ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  À Vista
                </button>
                <button 
                  type="button"
                  onClick={() => setForm(p => ({...p, launchType: "installment"}))}
                  className={cn("py-2 text-[10px] font-bold uppercase border rounded transition-all",
                    form.launchType === "installment" ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  Parcelado
                </button>
              </div>
            </Field>
          </div>
        </div>

        {form.launchType === 'installment' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-secondary/30 rounded-lg border border-border/50 grid grid-cols-3 gap-6 shadow-precision">
            <Field label="Modo de Valor">
              <div className="flex bg-background p-1 rounded border border-border">
                <button onClick={() => setForm(p => ({...p, amountMode: 'total'}))} className={cn("flex-1 text-[9px] font-bold py-1 rounded", form.amountMode === 'total' ? "bg-secondary" : "text-muted-foreground")}>TOTAL</button>
                <button onClick={() => setForm(p => ({...p, amountMode: 'installment'}))} className={cn("flex-1 text-[9px] font-bold py-1 rounded", form.amountMode === 'installment' ? "bg-secondary" : "text-muted-foreground")}>PARCELA</button>
              </div>
            </Field>
            <Field label="Parcela Inicial">
              <Input type="number" min={1} max={Number(form.totalInstallments)} value={form.startInstallment} 
                onChange={e => setForm(p => ({...p, startInstallment: e.target.value}))} className="h-9 text-xs border-zinc-800" />
            </Field>
            <Field label="Total de Parcelas">
              <Input type="number" min={2} max={360} value={form.totalInstallments} 
                onChange={e => setForm(p => ({...p, totalInstallments: e.target.value}))} className="h-9 text-xs border-zinc-800" />
            </Field>
          </motion.div>
        )}

        <div className="flex gap-4 pt-6 border-t border-border/50">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSubmit} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
            disabled={!form.description || !form.amount || createTx.isPending}>
            {createTx.isPending ? "Salvando..." : "Efetivar Lançamento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
