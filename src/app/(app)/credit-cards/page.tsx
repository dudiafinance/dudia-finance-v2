"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, ChevronRight, ChevronLeft, CreditCard as CardIcon,
  Clock, TrendingDown, Trash2, Pencil, PieChart,
  CheckCircle2, Wallet, ArrowDownLeft, ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TagInput } from "@/components/ui/tag-input";
import { 
  useCreditCards, 
  useCardTransactions, 
  useCreateCardTransaction, 
  useUpdateCardTransaction, 
  useDeleteCardTransaction,
  useCreateCreditCard,
  useUpdateCreditCard,
  usePayCardInvoice,
  useCategories,
  useAccounts,
  useInvoiceStatus,
  useUpdateInvoiceStatus
} from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

type CreditCard = {
  id: string;
  name: string;
  bank: string;
  lastDigits: string;
  limit: number | string;
  usedAmount?: number | string;
  dueDay: number | string;
  closingDay: number | string;
  gradient: string;
  color: string;
  network: string;
};

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
  installmentNumber?: number;
  totalInstallments?: number;
  notes?: string | null;
};

type AccountItem = {
  id: string;
  name: string;
  type: string;
  balance: number | string;
};

type CategoryItem = {
  id: string;
  name: string;
  type?: string;
  color?: string;
};

const GRADIENT_PRESETS = [
  { label: "Nubank", value: "bg-gradient-to-br from-[#820AD1] to-[#4B0082]", color: "#820AD1" },
  { label: "Inter", value: "bg-gradient-to-br from-[#FF7A00] to-[#E65100]", color: "#FF7A00" },
  { label: "Itau", value: "bg-gradient-to-br from-[#0047BB] to-[#002D72]", color: "#0047BB" },
  { label: "XP", value: "bg-gradient-to-br from-[#111111] to-[#333333]", color: "#111111" },
  { label: "Emerald", value: "bg-gradient-to-br from-[#059669] to-[#065F46]", color: "#059669" },
  { label: "Rose", value: "bg-gradient-to-br from-[#DB2777] to-[#831843]", color: "#DB2777" },
];

function getSuggestedInvoice(card: CreditCard | null | undefined, dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00'); 
  let m = d.getMonth() + 1;
  let y = d.getFullYear();
  const closing = card ? Number(card.closingDay) : 30;
  if (d.getDate() >= closing) {
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return { month: m, year: y };
}

export default function CreditCardsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userCurrency = session?.user?.currency ?? "BRL";
  const fmt = (v: number) => formatCurrency(v, userCurrency);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingTx, setEditingTx] = useState<CardTransaction | null>(null);

  const { data: rawCards = [], isLoading: isLoadingCards } = useCreditCards();
  const cards = rawCards as unknown as CreditCard[];
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  
  const showBalances = true; // Forced true for now based on previous redesign logic

  React.useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

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
  const updateInvoiceStatus = useUpdateInvoiceStatus(selectedCard?.id);
  const currentInvoiceStatus = (invoiceStatusData as { status?: string } | undefined)?.status || "ABERTA";

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
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando cartões...</p>
      </div>
    );
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

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8 shadow-precision">
          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-error" />
              Fatura do Período
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {selectedCard ? fmt(invoiceTotal) : "R$ 0,00"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Wallet className="h-3 w-3 text-success" />
              Disponível
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {selectedCard ? fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount)) : "R$ 0,00"}
            </p>
          </div>

          <div className="bg-background p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <CardIcon className="h-3 w-3 text-muted-foreground" />
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
                          <Pencil className="h-3.5 w-3.5" />
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
                <div className="flex items-center gap-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Detalhamento da Fatura</h2>
                  <div className="h-px flex-1 bg-border/40" />
                </div>

                <div className="bg-background rounded-lg border border-border/50 p-6 shadow-precision">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border p-1">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={prevInvoice} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <button 
                        onClick={goToToday}
                        className="px-4 h-8 text-[11px] font-bold uppercase text-foreground flex items-center gap-2"
                      >
                        {MONTH_NAMES[currentMonth-1]} {currentYear}
                        {currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear() && (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={nextInvoice} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => setIsPayModalOpen(true)}
                        className="h-9 px-6 text-[11px] font-bold uppercase border-border shadow-precision"
                      >
                        Liquidar Fatura
                      </Button>
                      <Button 
                        onClick={() => setIsLaunchModalOpen(true)}
                        className="h-9 px-6 text-[11px] font-bold uppercase shadow-precision"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Lançar Compra
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total da Fatura</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{fmt(invoiceTotal)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Limite Disponível</p>
                      <p className="text-2xl font-bold text-emerald-500 tabular-nums tracking-tight">
                        {fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount))}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fechamento</p>
                      <p className="text-sm font-bold text-foreground uppercase tracking-tight">Dia {selectedCard.closingDay}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vencimento</p>
                      <p className="text-sm font-bold text-foreground uppercase tracking-tight">Dia {selectedCard.dueDay}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <Button
                    variant={currentInvoiceStatus === "PAGA" ? "secondary" : "default"}
                    onClick={() => {
                      const statuses = ["ABERTA", "FECHADA", "PAGA"];
                      const next = statuses[(statuses.indexOf(currentInvoiceStatus) + 1) % statuses.length];
                      updateInvoiceStatus.mutate({ month: currentMonth, year: currentYear, status: next });
                    }}
                    className={cn(
                      "h-14 px-10 text-[12px] font-bold uppercase tracking-[0.2em] transition-all shadow-precision border-precision border-white/5",
                      currentInvoiceStatus === "PAGA" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" :
                      currentInvoiceStatus === "FECHADA" ? "bg-red-500 text-white hover:bg-red-600" :
                      "bg-foreground text-background"
                    )}
                  >
                    {currentInvoiceStatus === "PAGA" && <CheckCircle2 className="h-4 w-4 mr-3" />}
                    {currentInvoiceStatus === "ABERTA" ? "Fechar Fatura" : currentInvoiceStatus === "FECHADA" ? "Confirmar Pagamento" : "Fatura Liquidada"}
                  </Button>
                </div>

                <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
                  <div className="flex items-center justify-between p-5 border-b border-border/50 bg-secondary/20">
                    <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Lançamentos do Período</h3>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                      {transactions.length} REGISTROS
                    </span>
                  </div>

                  {isLoadingTx ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                      <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                      <Clock className="h-10 w-10 mx-auto mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma transação nesta fatura</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {transactions.map((tx) => {
                        const cat = categories.find(c => c.id === tx.categoryId);
                        const isRefund = Number(tx.amount) < 0;

                        return (
                          <div 
                            key={tx.id}
                            className="group flex items-center gap-4 p-4 hover:bg-secondary/30 cursor-pointer transition-all"
                            onClick={() => { setEditingTx(tx); setIsEditModalOpen(true); }}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded flex items-center justify-center border border-border/50 shrink-0",
                              isRefund ? "text-emerald-500" : "text-foreground"
                            )}>
                              {isRefund ? <ArrowDownLeft className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground tracking-tight truncate">{tx.description}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                {cat?.name ?? "Geral"} • {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                {tx.installmentNumber && ` • Parcela ${tx.installmentNumber}/${tx.totalInstallments}`}
                              </p>
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
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <CardFormModal 
        open={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)} 
        editingCard={editingCard} 
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
      />
    </div>
  );
}

// --- Sub-Modais ---

function CardFormModal({ open, onClose, editingCard }: { open: boolean, onClose: () => void, editingCard?: CreditCard | null }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
    gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
  });

  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();

  React.useEffect(() => {
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
        network: editingCard.network || "mastercard"
      });
    } else if (open) {
      setForm({
        name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
        gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
      });
    }
  }, [editingCard, open]);

  const handleSubmit = () => {
    const payload = { ...form, limit: Number(form.limit), dueDay: Number(form.dueDay), closingDay: Number(form.closingDay) };
    if (editingCard) {
      updateCard.mutate({ id: editingCard.id, ...payload } as any, { 
        onSuccess: () => {
          toast("Cartão atualizado!");
          onClose();
        },
        onError: (err) => {
          toast(err instanceof Error ? err.message : "Erro ao atualizar", "error");
        }
      });
    } else {
      createCard.mutate(payload as any, { 
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

  return (
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
            <Select value={form.network} onChange={e => setForm(p => ({...p, network: e.target.value}))} className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground uppercase font-bold tracking-widest">
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
                const normalizedGradient = form.gradient?.includes('bg-gradient') 
                  ? form.gradient 
                  : form.gradient?.startsWith('from-') 
                    ? `bg-gradient-to-br ${form.gradient}` 
                    : form.gradient;
                const isSelected = normalizedGradient === preset.value || form.gradient === preset.value;
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
  );
}

function LaunchTxModal({ open, onClose, selectedCard, currentMonth, currentYear }: { open: boolean, onClose: () => void, selectedCard?: CreditCard | null, currentMonth: number, currentYear: number }) {
  const [form, setForm] = useState({
    description: "", amount: "", type: "purchase", date: new Date().toISOString().split('T')[0],
    categoryId: "", launchType: "single", totalInstallments: "2", startInstallment: "1", isPending: false,
    invoiceMonth: currentMonth, invoiceYear: currentYear,
    amountMode: "total" as "total" | "installment",
    tags: [] as string[]
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const createTx = useCreateCardTransaction(selectedCard?.id || "");

  const handleDateChange = (date: string) => {
    const suggested = getSuggestedInvoice(selectedCard, date);
    setForm(p => ({ ...p, date, invoiceMonth: suggested.month, invoiceYear: suggested.year }));
  };

  React.useEffect(() => {
    if (open && selectedCard) {
      const suggested = getSuggestedInvoice(selectedCard, form.date);
      setForm(p => ({ ...p, invoiceMonth: suggested.month, invoiceYear: suggested.year }));
    }
  }, [open, selectedCard]);

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
    } as any, { onSuccess: onClose });
  };

  const expenseCategories = (categories as unknown as CategoryItem[]).filter((c) => c.type === 'expense');

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
                  {MONTH_NAMES.map((name, i) => (
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
              <Input type="number" min={2} value={form.totalInstallments} 
                onChange={e => setForm(p => ({...p, totalInstallments: e.target.value}))} className="h-9 text-xs border-zinc-800" />
            </Field>
          </motion.div>
        )}

        <div className="flex gap-4 pt-6 border-t border-border/50">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
          {form.launchType === 'installment' ? (
            <Button onClick={() => setIsPreviewOpen(true)} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
              disabled={!form.amount || !form.description}>
              Revisar Parcelamento
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision"
              disabled={!form.amount || !form.description || createTx.isPending}>
              {createTx.isPending ? "Processando..." : "Confirmar Lançamento"}
            </Button>
          )}
        </div>
      </div>

      <InstallmentPreviewModal 
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        form={form}
        onConfirm={() => {
          setIsPreviewOpen(false);
          handleSubmit();
        }}
        isSubmitting={createTx.isPending}
      />
    </Modal>
  );
}

type LaunchForm = {
  description: string;
  amount: string;
  type: string;
  date: string;
  categoryId: string;
  launchType: string;
  totalInstallments: string;
  startInstallment: string;
  isPending: boolean;
  invoiceMonth: number;
  invoiceYear: number;
  amountMode: "total" | "installment";
  tags: string[];
};

function InstallmentPreviewModal({ open, onClose, form, onConfirm, isSubmitting }: { open: boolean, onClose: () => void, form: LaunchForm, onConfirm: () => void, isSubmitting: boolean }) {
  const installments = useMemo(() => {
    const n = Number(form.totalInstallments) || 1;
    const start = Number(form.startInstallment) || 1;
    const totalAmount = form.amountMode === 'total' 
      ? (Number(form.amount) || 0) 
      : (Number(form.amount) || 0) * n;
    
    const amountInCents = Math.round(totalAmount * 100);
    const baseCents = Math.floor(amountInCents / n);
    const remainderCents = amountInCents - baseCents * (n - 1);

    const items = [];
    let m = form.invoiceMonth;
    let y = form.invoiceYear;

    for (let i = start; i <= n; i++) {
      const installmentCents = i === n ? remainderCents : baseCents;
      items.push({
        num: i,
        total: n,
        amount: installmentCents / 100,
        month: m,
        year: y
      });

      m++;
      if (m > 12) { m = 1; y++; }
    }
    return items;
  }, [form]);

  return (
    <Modal open={open} onClose={onClose} title="Plano de Parcelas" size="md">
      <div className="space-y-6 pt-2">
        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 no-scrollbar">
          {installments.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 shadow-precision">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                  {item.num}/{item.total}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-tight">
                    Fatura {MONTH_NAMES[item.month-1]} {item.year}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground tabular-nums tracking-tight">
                {formatCurrency(item.amount, "BRL")}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border/50 flex gap-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Voltar</Button>
          <Button onClick={onConfirm} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision" disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : "Confirmar Lançamentos"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PayInvoiceModal({ open, onClose, card, total, accounts, month, year, fmt }: { open: boolean, onClose: () => void, card?: CreditCard | null, total: number, accounts: AccountItem[], month: number, year: number, fmt: (v: number) => string }) {
  const [form, setForm] = useState({ accountId: "", amount: String(total), date: new Date().toISOString().split('T')[0] });
  const payInvoice = usePayCardInvoice();

  React.useEffect(() => { if(open) setForm(p => ({...p, amount: String(total || 0) }))}, [open, total]);

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

type EditTxForm = { description: string; amount: string; categoryId: string; invoiceMonth: number; invoiceYear: number; };
function EditTxModal({ open, onClose, tx, card }: { open: boolean, onClose: () => void, tx?: CardTransaction | null, card?: CreditCard | null }) {
  const [form, setForm] = useState<EditTxForm>({ description: "", amount: "", categoryId: "", invoiceMonth: 1, invoiceYear: 2024 });
  const [updateGroup, setUpdateGroup] = useState(false);
  const updateTx = useUpdateCardTransaction(card?.id || "");
  const deleteTx = useDeleteCardTransaction(card?.id || "");
  const { data: categories = [] } = useCategories();

  React.useEffect(() => {
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
    } as any, { onSuccess: onClose });
  };

  const handleDelete = () => {
    if (!tx) return;
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      deleteTx.mutate(tx.id, { onSuccess: onClose });
    }
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
                  {MONTH_NAMES.map((name, i) => (
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
