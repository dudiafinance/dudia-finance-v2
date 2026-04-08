"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, ChevronRight, ChevronLeft, CreditCard as CardIcon,
  Calendar, Clock, TrendingDown, Trash2, Pencil,
  CheckCircle2, Wallet, ArrowDownLeft, ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow } from "@/components/ui/form-field";
import { 
  useCreditCards, 
  useCardTransactions, 
  useCreateCardTransaction, 
  useUpdateCardTransaction, 
  useDeleteCardTransaction,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
  usePayCardInvoice,
  useCategories,
  useAccounts,
  useInvoiceStatus,
  useUpdateInvoiceStatus
} from "@/hooks/use-api";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const GRADIENT_PRESETS = [
  { label: "Nubank", value: "from-[#820AD1] to-[#4B0082]", color: "#820AD1" },
  { label: "Inter", value: "from-[#FF7A00] to-[#E65100]", color: "#FF7A00" },
  { label: "Itau", value: "from-[#0047BB] to-[#002D72]", color: "#0047BB" },
  { label: "XP", value: "from-[#111111] to-[#333333]", color: "#111111" },
  { label: "Emerald", value: "from-[#059669] to-[#065F46]", color: "#059669" },
  { label: "Rose", value: "from-[#DB2777] to-[#831843]", color: "#DB2777" },
];

function getSuggestedInvoice(card: any, dateStr: string) {
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
  
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<any>(null);

  const { data: cards = [], isLoading: isLoadingCards } = useCreditCards();
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  
  React.useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const { data: transactions = [], isLoading: isLoadingTx } = useCardTransactions(
    selectedCard?.id, 
    currentMonth, 
    currentYear
  );

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: invoiceStatusData } = useInvoiceStatus(selectedCard?.id, currentMonth, currentYear);
  const updateInvoiceStatus = useUpdateInvoiceStatus(selectedCard?.id);
  const currentInvoiceStatus = invoiceStatusData?.status || "ABERTA";

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
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Carregando cartões...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-blue-500 rounded-full" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Cartões de Crédito</h1>
            </div>
            <p className="text-slate-400 font-medium">Gerencie suas faturas e limites.</p>
          </div>

          <Button
            onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }}
            className="gap-3 font-bold"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Cartão</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Fatura Atual</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {selectedCard ? fmt(invoiceTotal) : "R$ 0,00"}
            </p>
            <p className="text-xs text-slate-500 mt-1">{transactions.length} transações</p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Limite Disponível</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {selectedCard ? fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount)) : "R$ 0,00"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedCard ? `${Math.round((Number(selectedCard.usedAmount) / Number(selectedCard.limit)) * 100)}% utilizado` : "Selecione um cartão"}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <CardIcon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", 
                currentInvoiceStatus === 'ABERTA' ? 'bg-blue-500' : 
                currentInvoiceStatus === 'PAGA' ? 'bg-emerald-500' : 'bg-red-500'
              )} />
              <p className="text-lg font-bold text-white uppercase">{currentInvoiceStatus}</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedCard?.bank || "Nenhum cartão"}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4">
              <CardIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum cartão cadastrado</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Adicione seus cartões para gerenciar suas faturas.</p>
            <Button onClick={() => setIsCardModalOpen(true)} className="mt-6 rounded-md bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cards Grid */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center">
                  <CardIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Meus Cartões</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => {
                  const isSelected = selectedCardId === card.id;
                  const usedPercent = (Number(card.usedAmount) / Number(card.limit)) * 100;
                  
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedCardId(card.id)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-5 transition-all",
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" 
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            card.gradient ? `bg-gradient-to-br ${card.gradient}` : "bg-slate-800"
                          )}>
                            <CardIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{card.name}</h3>
                            <p className="text-xs text-slate-500">{card.bank}</p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setEditingCard(card); setIsCardModalOpen(true); }}
                          className="h-8 w-8 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-none border-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">•••• {card.lastDigits}</span>
                          <span className="text-xs font-medium text-slate-400">{card.network.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Usado</span>
                          <span className={cn(
                            "font-semibold",
                            usedPercent > 80 ? "text-red-500" : "text-slate-900 dark:text-white"
                          )}>
                            {Math.round(usedPercent)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(usedPercent, 100)}%` }}
                            className={cn("h-full rounded-full", usedPercent > 80 ? "bg-red-500" : "bg-blue-500")}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Selected Card Dashboard */}
            {selectedCard && (
              <section className="space-y-6">
                {/* Invoice Header */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={prevInvoice} 
                        className="h-9 w-9"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={goToToday}
                        className="px-4 h-9 gap-2 font-bold text-slate-900 dark:text-white"
                      >
                        {MONTH_NAMES[currentMonth-1]} {currentYear}
                        {currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear() && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={nextInvoice} 
                        className="h-9 w-9"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="secondary"
                        onClick={() => setIsPayModalOpen(true)}
                        className="font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800"
                      >
                        Pagar Fatura
                      </Button>
                      <Button 
                        onClick={() => setIsLaunchModalOpen(true)}
                        className="font-bold shadow-lg"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Lançar
                      </Button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fatura do Período</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(invoiceTotal)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Limite Disponível</p>
                      <p className="text-3xl font-bold text-emerald-500 tabular-nums">
                        {fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount))}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-700">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fechamento</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Dia {selectedCard.closingDay}</p>
                      </div>
                      <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-700">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimento</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Dia {selectedCard.dueDay}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Button */}
                <div className="flex justify-center">
                  <Button
                    variant={currentInvoiceStatus === "PAGA" ? "glass" : currentInvoiceStatus === "FECHADA" ? "default" : "secondary"}
                    onClick={() => {
                      const statuses = ["ABERTA", "FECHADA", "PAGA"];
                      const next = statuses[(statuses.indexOf(currentInvoiceStatus) + 1) % statuses.length];
                      updateInvoiceStatus.mutate({ month: currentMonth, year: currentYear, status: next });
                    }}
                    className={cn(
                      "px-8 py-6 font-bold text-base transition-all shadow-xl",
                      currentInvoiceStatus === "PAGA" ? "bg-emerald-600/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-600/30" :
                      currentInvoiceStatus === "FECHADA" ? "bg-red-600 text-white hover:bg-red-700" :
                      "bg-blue-600/10 text-blue-600 border-blue-500/20 hover:bg-blue-600/20"
                    )}
                  >
                    {currentInvoiceStatus === "PAGA" && <CheckCircle2 className="h-5 w-5 mr-3" />}
                    Marcar como {currentInvoiceStatus === "ABERTA" ? "Fechada" : currentInvoiceStatus === "FECHADA" ? "Paga" : "Aberta"}
                  </Button>
                </div>

                {/* Transactions List */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lançamentos</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                      {transactions.length} registros
                    </span>
                  </div>

                  {isLoadingTx ? (
                    <div className="h-40 flex items-center justify-center">
                      <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">Nenhum lançamento em {MONTH_NAMES[currentMonth-1]}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx) => {
                        const cat = categories.find(c => c.id === tx.categoryId);
                        const color = cat?.color ?? "#94A3B8";
                        const isRefund = Number(tx.amount) < 0;

                        return (
                          <div 
                            key={tx.id}
                            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all"
                            onClick={() => { setEditingTx(tx); setIsEditModalOpen(true); }}
                          >
                            <div 
                              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <div 
                                className="h-8 w-8 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: color }}
                              >
                                {isRefund ? (
                                  <ArrowDownLeft className="h-4 w-4 text-white" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-white" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{tx.description}</p>
                              <p className="text-xs text-slate-500">
                                {cat?.name ?? "Outros"} • {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className={cn(
                                "font-semibold tabular-nums text-sm",
                                isRefund ? "text-emerald-600" : "text-slate-900 dark:text-white"
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

      {/* Card Form Modal */}
      <CardFormModal 
        open={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)} 
        editingCard={editingCard} 
      />

      {/* Launch Transaction Modal */}
      <LaunchTxModal 
        open={isLaunchModalOpen} 
        onClose={() => setIsLaunchModalOpen(false)}
        selectedCard={selectedCard}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Pay Invoice Modal */}
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

      {/* Edit Transaction Modal */}
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

function CardFormModal({ open, onClose, editingCard }: { open: boolean, onClose: () => void, editingCard?: any }) {
  const [form, setForm] = useState({
    name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
    gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
  });

  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();

  React.useEffect(() => {
    if (editingCard) {
      setForm({
        name: editingCard.name, bank: editingCard.bank, lastDigits: editingCard.lastDigits,
        limit: String(editingCard.limit), dueDay: String(editingCard.dueDay), closingDay: String(editingCard.closingDay),
        gradient: editingCard.gradient, color: editingCard.color, network: editingCard.network
      });
    } else {
      setForm({
        name: "", bank: "", lastDigits: "", limit: "", dueDay: "10", closingDay: "3",
        gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
      });
    }
  }, [editingCard, open]);

  const handleSubmit = () => {
    const payload = { ...form, limit: Number(form.limit), dueDay: Number(form.dueDay), closingDay: Number(form.closingDay) };
    if (editingCard) updateCard.mutate({ id: editingCard.id, ...payload }, { onSuccess: onClose });
    else createCard.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title={editingCard ? "Editar Cartão" : "Novo Cartão"} size="md">
      <div className="space-y-5 pt-2">
        <FormRow>
          <Field label="Banco">
            <Input value={form.bank} onChange={e => setForm(p => ({...p, bank: e.target.value}))} 
              placeholder="Ex: Nubank, Inter" className="h-11 rounded-md" />
          </Field>
          <Field label="Nome do Cartão">
            <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} 
              placeholder="Ex: Cartão Principal" className="h-11 rounded-md" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Últimos 4 Dígitos">
            <Input maxLength={4} value={form.lastDigits} onChange={e => setForm(p => ({...p, lastDigits: e.target.value}))} 
              placeholder="1234" className="h-11 rounded-md text-center" />
          </Field>
          <Field label="Limite (R$)">
            <Input type="number" value={form.limit} onChange={e => setForm(p => ({...p, limit: e.target.value}))} 
              placeholder="5000.00" className="h-11 rounded-md" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Dia de Vencimento">
            <Input type="number" value={form.dueDay} onChange={e => setForm(p => ({...p, dueDay: e.target.value}))} 
              className="h-11 rounded-md text-center" />
          </Field>
          <Field label="Dia de Fechamento">
            <Input type="number" value={form.closingDay} onChange={e => setForm(p => ({...p, closingDay: e.target.value}))} 
              className="h-11 rounded-md text-center" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Bandeira">
            <Select value={form.network} onChange={e => setForm(p => ({...p, network: e.target.value}))} className="h-11 rounded-md">
              <option value="mastercard">Mastercard</option>
              <option value="visa">Visa</option>
              <option value="elo">Elo</option>
              <option value="amex">American Express</option>
              <option value="hipercard">Hipercard</option>
            </Select>
          </Field>
          <Field label="Estilo">
            <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              {GRADIENT_PRESETS.map(preset => (
                <Button 
                  key={preset.value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setForm(p => ({...p, gradient: preset.value, color: preset.color}))}
                  className={cn(
                    "h-10 w-10 p-0 overflow-hidden ring-offset-2 transition-all",
                    preset.value,
                    form.gradient === preset.value ? "ring-2 ring-blue-500 scale-110 shadow-lg" : "opacity-40 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </Field>
        </FormRow>

        <div className="flex gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="flex-1 font-bold">Cancelar</Button>
          <Button onClick={handleSubmit} className="flex-1 font-bold shadow-lg"
            disabled={createCard.isPending || updateCard.isPending}>
            {createCard.isPending || updateCard.isPending ? "Salvando..." : "Salvar Cartão"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LaunchTxModal({ open, onClose, selectedCard, currentMonth, currentYear }: any) {
  const [form, setForm] = useState({
    description: "", amount: "", type: "purchase", date: new Date().toISOString().split('T')[0],
    categoryId: "", launchType: "single", totalInstallments: "2", startInstallment: "1", isPending: false,
    invoiceMonth: currentMonth, invoiceYear: currentYear,
    amountMode: "total" as "total" | "installment"
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const createTx = useCreateCardTransaction(selectedCard?.id || "");

  const handleDateChange = (date: string) => {
    const suggested = getSuggestedInvoice(selectedCard, date);
    setForm(p => ({ ...p, date, invoiceMonth: suggested.month, invoiceYear: suggested.year }));
  };

  React.useEffect(() => {
    if (open) {
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
    }, { onSuccess: onClose });
  };

  const expenseCategories = categories.filter((c: any) => c.type === 'expense');

  return (
     <Modal open={open} onClose={onClose} title="Novo Lançamento" size="lg">
      <div className="space-y-6 pt-2">
        {/* Step 1: Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-blue-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informações Básicas</span>
          </div>
          
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { key: "purchase", label: "Compra", icon: TrendingDown },
              { key: "refund", label: "Estorno", icon: ArrowDownLeft },
            ].map(({ key, label }) => (
              <Button 
                key={key} 
                variant={form.type === key ? "secondary" : "ghost"}
                onClick={() => setForm(p => ({...p, type: key}))}
                className={cn("flex-1 transition-all rounded-lg font-bold",
                  form.type === key ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {label}
              </Button>
            ))}
          </div>

          <Field label="Descrição" required>
            <div className="relative">
              <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Ex: Supermercado, Amazon..." className="h-12 rounded-xl font-medium pl-4" />
            </div>
          </Field>

          <FormRow>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={e => setForm(p => ({...p, categoryId: e.target.value}))} className="h-12 rounded-xl">
                <option value="">Sem categoria</option>
                {expenseCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Data de Lançamento">
              <Input type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} className="h-12 rounded-xl" />
            </Field>
          </FormRow>
        </div>

        {/* Step 2: Payment Details */}
        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-amber-500 rounded-full" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pagamento</span>
            </div>
            {form.launchType === 'installment' && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <Button 
                  size="sm" 
                  variant={form.amountMode === 'total' ? 'secondary' : 'ghost'}
                  onClick={() => setForm(p => ({...p, amountMode: 'total'}))}
                  className="h-7 text-[10px] px-2 font-bold rounded-md"
                >
                  $ TOTAL
                </Button>
                <Button 
                  size="sm" 
                  variant={form.amountMode === 'installment' ? 'secondary' : 'ghost'}
                  onClick={() => setForm(p => ({...p, amountMode: 'installment'}))}
                  className="h-7 text-[10px] px-2 font-bold rounded-md"
                >
                  $ PARCELA
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={form.amountMode === 'total' ? "Valor Total" : "Valor da Parcela"} required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                  placeholder="0,00" className="pl-10 h-12 text-xl font-bold rounded-xl border-2 focus:border-blue-500" />
                {form.amountMode === 'installment' && form.amount && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                    <span className="text-[10px] font-bold">TOTAL: {formatCurrency(calculatedTotal, "BRL")}</span>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Tipo de Lançamento">
              <Select value={form.launchType} onChange={e => setForm(p => ({...p, launchType: e.target.value as any}))} className="h-12 rounded-xl font-semibold">
                <option value="single">À Vista</option>
                <option value="installment" disabled={form.type === 'refund'}>Parcelado</option>
                <option value="fixed" disabled={form.type === 'refund'}>Fixo/Mensal</option>
              </Select>
            </Field>
          </div>

          {form.launchType === 'installment' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <Field label="Parcela Inicial" className="flex-1">
                <div className="relative">
                  <Input type="number" min={1} max={Number(form.totalInstallments)} value={form.startInstallment} 
                    onChange={e => setForm(p => ({...p, startInstallment: e.target.value}))} className="h-12 rounded-xl text-center font-bold" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>
              <Field label="Total de Parcelas" className="flex-1">
                <div className="relative">
                  <Input type="number" min={2} value={form.totalInstallments} 
                    onChange={e => setForm(p => ({...p, totalInstallments: e.target.value}))} className="h-12 rounded-xl text-center font-bold" />
                  <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </Field>
            </motion.div>
          )}
        </div>

        {/* Step 3: Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ciclo de Fatura</span>
          </div>
          
          <FormRow>
            <Field label="Mês Inicial">
              <Select 
                value={form.invoiceMonth} 
                onChange={e => setForm(p => ({...p, invoiceMonth: Number(e.target.value)}))} 
                className="h-12 rounded-xl font-medium"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Ano">
              <Input 
                type="number" 
                value={form.invoiceYear} 
                onChange={e => setForm(p => ({...p, invoiceYear: Number(e.target.value)}))} 
                className="h-12 rounded-xl font-medium" 
              />
            </Field>
          </FormRow>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 font-bold rounded-xl border-slate-200">Cancelar</Button>
          {form.launchType === 'installment' ? (
            <Button onClick={() => setIsPreviewOpen(true)} className="flex-1 h-12 font-bold rounded-xl shadow-xl shadow-blue-500/20"
              disabled={!form.amount || !form.description}>
              Ver Parcelas Planejadas
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 h-12 font-bold rounded-xl shadow-xl shadow-blue-500/20"
              disabled={!form.amount || !form.description || createTx.isPending}>
              {createTx.isPending ? "Lançando..." : "Confirmar Lançamento"}
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

function InstallmentPreviewModal({ open, onClose, form, onConfirm, isSubmitting }: any) {
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
    <Modal open={open} onClose={onClose} title="Pré-visualização das Parcelas" size="md">
      <div className="space-y-4 pt-2">
        <p className="text-sm text-slate-500">Confira abaixo os lançamentos que serão gerados nas suas próximas faturas:</p>
        
        <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {installments.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  {item.num}/{item.total}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Fatura de {MONTH_NAMES[item.month-1]} {item.year}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(item.amount, "BRL")}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 font-bold">Voltar</Button>
          <Button onClick={onConfirm} className="flex-1 font-bold shadow-lg" disabled={isSubmitting}>
            {isSubmitting ? "Lançando..." : "Confirmar Lançamentos"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PayInvoiceModal({ open, onClose, card, total, accounts, month, year, fmt }: any) {
  const [form, setForm] = useState({ accountId: "", amount: String(total), date: new Date().toISOString().split('T')[0] });
  const payInvoice = usePayCardInvoice();

  React.useEffect(() => { if(open) setForm(p => ({...p, amount: String(total || 0) }))}, [open, total]);

  const handlePay = () => {
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
      <div className="space-y-5 pt-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 text-center border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Valor da Fatura</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{fmt(Number(form.amount))}</p>
        </div>

        <Field label="Conta de Origem" required>
          <Select value={form.accountId} onChange={e => setForm(p => ({...p, accountId: e.target.value}))} className="h-11 rounded-md">
            <option value="">Selecione a conta...</option>
            {accounts.filter((a: any) => a.type !== 'credit_card').map((acc: any) => (
              <option key={acc.id} value={acc.id}>{acc.name} ({fmt(Number(acc.balance))})</option>
            ))}
          </Select>
        </Field>

        <Field label="Data do Pagamento">
          <Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="h-11 rounded-md" />
        </Field>

        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-md font-medium">Cancelar</Button>
          <Button onClick={handlePay} className="flex-1 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-700"
            disabled={!form.accountId || payInvoice.isPending}>
            {payInvoice.isPending ? "Processando..." : "Confirmar Pagamento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditTxModal({ open, onClose, tx, card }: any) {
  const [form, setForm] = useState<any>({ description: "", amount: "", categoryId: "", invoiceMonth: 1, invoiceYear: 2024 });
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
    const isRefund = Number(tx.amount) < 0;
    const amountVal = Math.abs(Number(form.amount)) * (isRefund ? -1 : 1);
    
    updateTx.mutate({ 
      id: tx.id, 
      ...form, 
      amount: amountVal,
      categoryId: form.categoryId || null,
      updateGroup 
    }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      deleteTx.mutate(tx.id, { onSuccess: onClose });
    }
  };

  if (!tx) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar Lançamento" size="md">
      <div className="space-y-5 pt-2">
        <Field label="Descrição">
          <Input value={form.description} onChange={e => setForm((p: any) => ({...p, description: e.target.value}))} className="h-11 rounded-md" />
        </Field>

        <FormRow>
          <Field label="Valor (R$)">
            <Input type="number" value={form.amount} onChange={e => setForm((p: any) => ({...p, amount: e.target.value}))} className="h-11 rounded-md" />
          </Field>
          <Field label="Categoria">
            <Select value={form.categoryId} onChange={e => setForm((p: any) => ({...p, categoryId: e.target.value}))} className="h-11 rounded-md">
              <option value="">Sem Categoria</option>
              {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Mês">
            <Select value={form.invoiceMonth} onChange={e => setForm((p: any) => ({...p, invoiceMonth: Number(e.target.value)}))} className="h-11 rounded-md">
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ano">
            <Input type="number" value={form.invoiceYear} onChange={e => setForm((p: any) => ({...p, invoiceYear: Number(e.target.value)}))} className="h-11 rounded-md" />
          </Field>
        </FormRow>

        {tx.groupId && (
          <label className="flex items-center gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 cursor-pointer">
            <input type="checkbox" checked={updateGroup} onChange={e => setUpdateGroup(e.target.checked)}
              className="w-5 h-5 rounded border-amber-300 text-amber-500" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Aplicar em todas as parcelas seguintes
            </span>
          </label>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-md font-medium">Cancelar</Button>
          <Button onClick={handleUpdate} className="flex-1 rounded-md font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={updateTx.isPending}>
            {updateTx.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}