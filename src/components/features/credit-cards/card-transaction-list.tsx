"use client";

import { Clock, TrendingDown, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type CardTransaction = {
  id: string;
  description: string;
  amount: number | string;
  categoryId?: string | null;
  invoiceMonth: number;
  invoiceYear: number;
  groupId?: string | null;
  type?: string;
  date: string;
  isPaid?: boolean;
  currentInstallment?: number | null;
  totalInstallments?: number | null;
  tags?: string[] | null;
  notes?: string | null;
};

type CategoryItem = {
  id: string;
  name: string;
  type?: string;
  color?: string;
};

interface CardTransactionListProps {
  transactions: CardTransaction[];
  categories: CategoryItem[];
  isLoading: boolean;
  onEditTransaction: (tx: CardTransaction) => void;
  fmt: (v: number) => string;
}

export function CardTransactionList({
  transactions,
  categories,
  isLoading,
  onEditTransaction,
  fmt,
}: CardTransactionListProps) {
  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
        <div className="p-20 flex flex-col items-center justify-center gap-4">
          <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
        <div className="py-20 text-center opacity-30">
          <Clock className="h-10 w-10 mx-auto mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma transação nesta fatura</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
      <div className="flex items-center justify-between p-5 border-b border-border/50 bg-secondary/20">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Lançamentos do Período</h3>
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
          {transactions.length} REGISTROS
        </span>
      </div>

      <div className="divide-y divide-border/50">
        {transactions.map((tx) => {
          const cat = categories.find(c => c.id === tx.categoryId);
          const isRefund = Number(tx.amount) < 0;
          const isInstallment = tx.totalInstallments && tx.totalInstallments > 1;
          const installmentLabel = isInstallment
            ? `${tx.currentInstallment}/${tx.totalInstallments}`
            : '1x';

          return (
            <div
              key={tx.id}
              className="group flex items-center gap-4 p-4 hover:bg-secondary/30 cursor-pointer transition-all"
              onClick={() => onEditTransaction(tx)}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={cn(
                  "h-8 w-8 rounded flex items-center justify-center border border-border/50",
                  isRefund ? "text-emerald-500" : "text-foreground"
                )}>
                  {isRefund ? <ArrowDownLeft className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground">
                  {installmentLabel}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground tracking-tight truncate">{tx.description}</p>
                  {tx.tags && tx.tags.length > 0 && (
                    <div className="flex gap-1">
                      {tx.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  <span>{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span className="opacity-50">•</span>
                  <span>{cat?.name ?? "Sem categoria"}</span>
                  {tx.notes && (
                    <>
                      <span className="opacity-50">•</span>
                      <span className="truncate max-w-[100px]">{tx.notes}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold tabular-nums tracking-tight",
                  isRefund ? "text-emerald-500" : "text-foreground"
                )}>
                  {isRefund ? `+${fmt(Math.abs(Number(tx.amount)))}` : fmt(Number(tx.amount))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
