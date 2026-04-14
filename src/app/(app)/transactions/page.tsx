"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Eye, EyeOff, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTransactions, useCategories, useAccounts, useTags } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { TransactionSkeleton } from "@/components/features/transactions/transaction-skeleton";
import { TransactionTable } from "@/components/features/transactions/transaction-table";
import { TransactionFilters } from "@/components/features/transactions/transaction-filters";
import { TransactionForm } from "@/components/features/transactions/transaction-form";

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

type CategoryItem = { id: string; name: string; type: string; color?: string; tags?: string[] };
type AccountItem = { id: string; name: string; balance?: number | string };
type TagItem = { id: string; name: string };

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
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedItems, setAccumulatedItems] = useState<Transaction[]>([]);

  const [showBalances, setShowBalances] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useTransactions({
    search: searchTerm,
    type: filterType,
    isPaid: filterPaid === "paid" ? "true" : filterPaid === "pending" ? "false" : undefined,
    cursor: cursor,
    limit: 50
  });

  const { data: categories = [] } = useCategories();
  const { data: accountsData = [] } = useAccounts();
  const { data: globalTags = [] } = useTags();

  const typedGlobalTags = (globalTags ?? []) as unknown as TagItem[];
  const typedCategories = (categories ?? []) as unknown as CategoryItem[];
  const typedAccounts = (accountsData ?? []) as unknown as AccountItem[];

  const resetPagination = () => {
    setCursor(undefined);
    setAccumulatedItems([]);
  };

  const items = useMemo(
    () => (txData?.items ?? []) as unknown as Transaction[],
    [txData?.items]
  );
  const metadata = txData?.metadata;
  const itemsKey = useMemo(() => JSON.stringify(items.map(i => i.id)), [items]);

  const updateAccumulatedItems = useCallback((newItems: Transaction[]) => {
    setAccumulatedItems(prev => {
      if (!cursor) return newItems;
      const ids = new Set(prev.map(i => i.id));
      const uniqueNewItems = newItems.filter(i => !ids.has(i.id));
      return [...prev, ...uniqueNewItems];
    });
  }, [cursor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateAccumulatedItems(items);
  }, [itemsKey, cursor, updateAccumulatedItems]);

  const handleLoadMore = () => {
    if (metadata?.hasMore && txData?.nextCursor) {
      setCursor(txData.nextCursor);
    }
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

  const openCreate = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    resetPagination();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  if (txLoading) {
    return <TransactionSkeleton />;
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-success" />
              Receitas
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {showBalances ? fmt(totalIncome) : "••••••"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-error" />
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
              netBalance >= 0 ? "text-foreground" : "text-error"
            )}>
              {showBalances ? fmt(netBalance) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={(v) => { setSearchTerm(v); resetPagination(); }}
          filterType={filterType}
          onFilterTypeChange={(v) => { setFilterType(v); resetPagination(); }}
          filterPaid={filterPaid}
          onFilterPaidChange={(v) => { setFilterPaid(v); resetPagination(); }}
          showFilters={filterPaid !== "all" || filterType !== "all"}
          onToggleFilters={() => {}}
          onClearFilters={() => { setFilterPaid("all"); setFilterType("all"); setSearchTerm(""); resetPagination(); }}
        />

        <TransactionTable
          grouped={grouped}
          typedCategories={typedCategories}
          typedAccounts={typedAccounts}
          userCurrency={userCurrency}
          onEdit={openEdit}
          hasMore={!!metadata?.hasMore}
          isFetching={!!txFetching}
          onLoadMore={handleLoadMore}
        />
      </div>

      <Modal 
        open={modalOpen} 
        onClose={handleCloseModal}
        title={editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}
        description={editingTransaction ? "Ajuste os detalhes deste registro" : "Informe os dados para o novo registro"} 
        size="lg"
      >
        <TransactionForm
          editingTransaction={editingTransaction}
          categories={typedCategories}
          accounts={typedAccounts}
          globalTags={typedGlobalTags}
          userCurrency={userCurrency}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
  );
}
