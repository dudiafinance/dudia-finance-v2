"use client";

import React, { useState } from "react";
import { Plus, CreditCard as CardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useCreditCards, useCardTransactions, useDeleteCardTransaction, useCategories, useAccounts, useInvoiceStatus, useDeleteCreditCard } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { CreditCardSkeleton } from "@/components/features/credit-cards/credit-card-skeleton";
import { CardFormModal } from "@/components/features/credit-cards/card-form-modal";
import { InvoiceDetails } from "@/components/features/credit-cards/invoice-details";
import { CardTransactionList } from "@/components/features/credit-cards/card-transaction-list";
import { LaunchTxModal, PayInvoiceModal, EditTxModal } from "@/components/features/credit-cards/modals";
import { 
  CreditCard, 
  CardTransaction, 
  CategoryItem, 
  AccountItem,
  getSuggestedInvoice 
} from "@/types/finance";

export default function CreditCardsPage() {
  const { user } = useUser();
  const userCurrency = user?.publicMetadata?.currency as string ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);
  const { toast } = useToast();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingTx, setEditingTx] = useState<CardTransaction | null>(null);

  const { data: rawCards = [], isLoading: isLoadingCards } = useCreditCards();
  const cards = rawCards as unknown as CreditCard[];
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

  const { data: rawTransactions = [], isLoading: isLoadingTx } = useCardTransactions(
    selectedCard?.id, 
    currentMonth, 
    currentYear
  );

  const transactions = rawTransactions as unknown as CardTransaction[];
  const { data: rawCategories = [] } = useCategories();
  const categories = rawCategories as unknown as CategoryItem[];
  const { data: rawAccounts = [] } = useAccounts();
  const accounts = rawAccounts as unknown as AccountItem[];
  const { data: invoiceStatusData } = useInvoiceStatus(selectedCard?.id, currentMonth, currentYear);
  const currentInvoiceStatus = (invoiceStatusData as { status?: string } | undefined)?.status || "ABERTA";
  const deleteCreditCard = useDeleteCreditCard();
  const deleteCardTransaction = useDeleteCardTransaction(selectedCard?.id || "");

  const invoiceTotal = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);

  const nextInvoice = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const prevInvoice = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const goToToday = () => {
    const suggested = getSuggestedInvoice(selectedCard, new Date().toISOString().split('T')[0]);
    setCurrentMonth(suggested.month);
    setCurrentYear(suggested.year);
  };

  if (isLoadingCards) {
    return <CreditCardSkeleton />;
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gestão de Crédito</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Cartões</h1>
          </div>

          <Button
            onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }}
            className="gap-2 h-8 text-[11px] font-bold uppercase shadow-precision"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Cartão</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              Fatura do Período
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {selectedCard ? fmt(invoiceTotal) : "R$ 0,00"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              Disponível
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {selectedCard ? fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount)) : "R$ 0,00"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              Status
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground uppercase tabular-nums">{currentInvoiceStatus}</p>
              <div className={cn("h-2 w-2 rounded-full", 
                currentInvoiceStatus === 'ABERTA' ? 'bg-success' : 
                currentInvoiceStatus === 'PAGA' ? 'bg-success' : 'bg-error'
              )} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <CardIcon className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum cartão</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Cards Grid */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Meus Cartões</h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                  const isSelected = selectedCardId === card.id;
                  const usedPercent = (Number(card.usedAmount) / Number(card.limit)) * 100;
                  
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedCardId(card.id)}
                      className={cn(
                        "group cursor-pointer rounded-lg border p-6 transition-all duration-300 shadow-precision relative overflow-hidden",
                        isSelected 
                          ? "bg-secondary/50 border-foreground/20 ring-1 ring-foreground/10" 
                          : "bg-background border-border/50 hover:border-border hover:bg-secondary/20"
                      )}
                    >
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded flex items-center justify-center border border-white/10 shadow-precision transition-transform group-hover:scale-105",
                            card.gradient 
                              ? (card.gradient.includes('bg-gradient') ? card.gradient : `bg-gradient-to-br ${card.gradient}`) 
                              : "bg-zinc-800"
                          )}>
                            <CardIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight">{card.name}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.bank}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setEditingCard(card); setIsCardModalOpen(true); }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </Button>
                      </div>
                      
                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground tracking-widest uppercase">•••• {card.lastDigits}</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{card.network}</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-muted-foreground">Utilização</span>
                            <span className={cn(
                              usedPercent > 80 ? "text-red-500" : "text-foreground"
                            )}>
                              {usedPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(usedPercent, 100)}%` }}
                              className={cn("h-full rounded-full", usedPercent > 80 ? "bg-red-500" : "bg-foreground")}
                            />
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-0 right-0 h-12 w-12 bg-foreground/5 blur-2xl rounded-full -mr-6 -mt-6" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {selectedCard && (
              <section className="space-y-8">
                <InvoiceDetails
                  card={selectedCard}
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  invoiceTotal={invoiceTotal}
                  invoiceStatus={currentInvoiceStatus}
                  onPrevMonth={prevInvoice}
                  onNextMonth={nextInvoice}
                  onGoToToday={goToToday}
                  onPayInvoice={() => setIsPayModalOpen(true)}
                  onLaunchTransaction={() => setIsLaunchModalOpen(true)}
                  fmt={fmt}
                />

                <CardTransactionList
                  transactions={transactions}
                  categories={categories}
                  isLoading={isLoadingTx}
                  onEditTransaction={(tx) => { setEditingTx(tx); setIsEditModalOpen(true); }}
                  fmt={fmt}
                />
              </section>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CardFormModal 
        open={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)} 
        editingCard={editingCard}
        onDelete={(id: string) => setDeleteCardId(id)}
      />

      <LaunchTxModal 
        open={isLaunchModalOpen} 
        onClose={() => setIsLaunchModalOpen(false)}
        selectedCard={selectedCard}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      <PayInvoiceModal 
        open={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        card={selectedCard}
        total={invoiceTotal}
        accounts={accounts}
        month={currentMonth}
        year={currentYear}
        fmt={fmt}
      />

      <EditTxModal 
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tx={editingTx}
        card={selectedCard}
        onDeleteTx={() => setDeleteTxId(editingTx?.id ?? null)}
      />

      <AlertDialog
        open={!!deleteCardId}
        onClose={() => setDeleteCardId(null)}
        onConfirm={() => {
          if (!deleteCardId) return;
          deleteCreditCard.mutate(deleteCardId, {
            onSuccess: () => {
              toast("Cartão excluído!");
              setDeleteCardId(null);
              if (selectedCardId === deleteCardId) {
                setSelectedCardId(cards.find(c => c.id !== deleteCardId)?.id ?? null);
              }
            },
            onError: (err) => {
              toast(err instanceof Error ? err.message : "Erro ao excluir", "error");
              setDeleteCardId(null);
            }
          });
        }}
        title="Excluir Cartão"
        description="Todas as transações vinculadas a este cartão serão perdidas. Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteCreditCard.isPending}
      />

      <AlertDialog
        open={!!deleteTxId}
        onClose={() => setDeleteTxId(null)}
        onConfirm={() => {
          if (!deleteTxId) return;
          deleteCardTransaction.mutate(deleteTxId, {
            onSuccess: () => {
              toast("Lançamento excluído!");
              setDeleteTxId(null);
              setIsEditModalOpen(false);
            },
            onError: (err) => {
              toast(err instanceof Error ? err.message : "Erro ao excluir", "error");
              setDeleteTxId(null);
            }
          });
        }}
        title="Excluir Lançamento"
        description="Esta operação removerá o registro permanentemente da fatura."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteCardTransaction.isPending}
      />
    </div>
  );
}
