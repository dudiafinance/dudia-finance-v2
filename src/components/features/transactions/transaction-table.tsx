"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Transaction, CategoryItem, AccountItem } from "@/types/finance";

interface TransactionTableProps {
  grouped: [string, Transaction[]][];
  typedCategories: CategoryItem[];
  typedAccounts: AccountItem[];
  userCurrency: string;
  onEdit: (t: Transaction) => void;
  hasMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}

export function TransactionTable({
  grouped,
  typedCategories,
  typedAccounts,
  userCurrency,
  onEdit,
  hasMore,
  isFetching,
  onLoadMore,
}: TransactionTableProps) {
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
        <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum registro</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {grouped.map(([groupName, items]) => (
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
                  onClick={() => onEdit(t)}
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
                      <span className="flex items-center gap-1">{subtitle}</span>
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
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button 
            variant="outline" 
            onClick={onLoadMore} 
            disabled={isFetching}
            className="gap-2 px-12 h-11 text-[11px] font-bold uppercase tracking-widest transition-all shadow-precision border-border hover:bg-secondary"
          >
            {isFetching ? (
              <div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 rotate-90" />
            )}
            <span>Carregar mais transações</span>
          </Button>
        </div>
      )}
    </div>
  );
}
