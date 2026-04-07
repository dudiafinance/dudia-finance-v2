"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard as CardIcon,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingDown,
  MoreVertical,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  X,
  Target,
  Lock,
  Unlock,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TagInput } from "@/components/ui/tag-input";
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
  useTags,
  useAccounts,
  useInvoiceStatus,
  useUpdateInvoiceStatus
} from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Helpers ---
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

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

  // Regra de Fechamento: Se passou do dia de corte (vencido/inclusive), joga para a PRÓXIMA fatura
  const closing = card ? Number(card.closingDay) : 30;
  if (d.getDate() >= closing) {
    m++;
    if (m > 12) { m = 1; y++; }
  }

  return { month: m, year: y };
}

// --- Components ---

function NetworkLogo({ network }: { network: string }) {
  const logos: Record<string, string> = {
    mastercard: "MC", visa: "VISA", elo: "ELO", amex: "AMEX", hipercard: "HIPER"
  };
  return <span className="text-[10px] font-black tracking-tighter text-white/50">{logos[network] ?? network.toUpperCase()}</span>;
}

export default function CreditCardsPage() {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<any>(null);

  // Data Hooks
  const { data: cards = [], isLoading: isLoadingCards } = useCreditCards();
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  
  // Sincronizar ID selecionado
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

  const { data: invoiceStatusData, isLoading: isLoadingStatus } = useInvoiceStatus(selectedCard?.id, currentMonth, currentYear);
  const updateInvoiceStatus = useUpdateInvoiceStatus(selectedCard?.id);
  const currentInvoiceStatus = invoiceStatusData?.status || "ABERTA";

  const invoiceTotal = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);

  // Handlers
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

  if (isLoadingCards) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full" 
      />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50/50 overflow-x-hidden font-sans">
           {/* ── Background Aura ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            backgroundColor: selectedCard?.color || '#820AD1',
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[160px]"
        />
        <motion.div 
          animate={{ 
            backgroundColor: selectedCard?.color || '#820AD1',
            opacity: [0.02, 0.06, 0.02]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[140px]"
        />
      </div>

      <div className="relative z-10 w-full pt-8 pb-32">
        
        <header className="flex items-center justify-between mb-8 px-6 sm:px-12">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Wallet className="h-7 w-7 text-slate-400" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">Minha Carteira</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 ml-1 opacity-70">DUDIA Finance Premium Experience</p>
          </div>
          <button 
            onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }}
            className="h-14 w-14 glass-card rounded-[24px] flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-500 group shadow-xl border-white/40"
          >
            <Plus className="h-7 w-7 text-slate-600 group-hover:text-black transition-colors" />
          </button>
        </header>

        {/* ── Apple Wallet Style Carousel ───── */}
        <section className="mb-12 relative">
          {cards.length === 0 ? (
            <div className="mx-6 sm:mx-12 flex flex-col items-center justify-center p-20 glass-card rounded-[48px] border-dashed border-2 border-slate-200 text-center">
              <div className="h-20 w-20 bg-white rounded-[32px] flex items-center justify-center shadow-xl mb-6">
                <CardIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Configure sua Carteira</h3>
              <p className="text-slate-400 max-w-xs mx-auto mt-2 text-sm font-medium">Adicione seus cartões para começar a gerenciar suas faturas com elegância.</p>
              <Button onClick={() => setIsCardModalOpen(true)} className="mt-8 rounded-2xl px-10 h-14 bg-slate-900 text-white font-black hover:scale-105 transition-all">Começar Agora</Button>
            </div>
          ) : (
            <div className="relative w-full overflow-visible">
              <div className="flex overflow-x-auto gap-2 sm:gap-6 px-6 sm:px-12 py-12 no-scrollbar snap-x snap-mandatory perspective-[2000px]">
                {cards.map((card, idx) => {
                  const isSelected = selectedCardId === card.id;
                  const cardIdx = cards.findIndex(c => c.id === selectedCardId);
                  const offset = idx - cardIdx;
                  
                  return (
                    <motion.div
                      key={card.id}
                      initial={false}
                      animate={{
                        scale: isSelected ? 1.05 : 0.85,
                        opacity: isSelected ? 1 : 0.6,
                        x: isSelected ? 0 : offset * -40,
                        y: isSelected ? -10 : 30,
                        rotateY: isSelected ? 0 : offset * 12,
                        z: isSelected ? 0 : Math.abs(offset) * -150,
                      }}
                      whileHover={{ scale: isSelected ? 1.08 : 0.9, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="snap-center shrink-0 w-[300px] sm:w-[380px] cursor-pointer relative z-10"
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <div className={cn(
                        "relative h-52 sm:h-60 rounded-[44px] p-8 text-white transition-all duration-700 overflow-hidden shadow-2xl premium-shadow group/card ring-1 ring-white/20",
                        card.gradient ? `bg-gradient-to-br ${card.gradient}` : "bg-gradient-to-br from-slate-800 to-slate-900"
                      )}>
                        {/* Interactive Mesh/Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-[60px] rounded-full group-hover/card:scale-150 transition-transform duration-1000" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/20 blur-[60px] rounded-full group-hover/card:scale-150 transition-transform duration-1000" />
                        {/* Interactive Shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[120%] group-hover/card:translate-x-[120%] transition-transform duration-1000" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="max-w-[70%]">
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.25em] mb-1">{card.bank}</p>
                            <h4 className="text-2xl font-black text-white text-glow leading-tight truncate">{card.name}</h4>
                          </div>
                          <div className="h-10 w-14 glass-card rounded-xl flex items-center justify-center border-white/10">
                            <NetworkLogo network={card.network} />
                          </div>
                        </div>

                        <div className="mt-8 relative z-10 flex items-center gap-4">
                          <div className="h-10 w-14 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] opacity-80" />
                          <p className="font-mono text-xl tracking-[0.35em] text-white/90 font-medium">•••• {card.lastDigits}</p>
                        </div>

                        <div className="mt-auto relative z-10 flex justify-between items-end">
                           <div className="flex-1 mr-6">
                              <div className="flex justify-between items-center mb-1.5 px-0.5">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Utilizado</span>
                                <span className="text-[10px] font-black text-white/80">{Math.round((Number(card.usedAmount) / Number(card.limit)) * 100)}%</span>
                              </div>
                              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden p-[1px]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((Number(card.usedAmount) / Number(card.limit)) * 100, 100)}%` }}
                                  className={cn("h-full rounded-full transition-all duration-1000", (Number(card.usedAmount) / Number(card.limit)) > 0.8 ? "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)]" : "bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]")}
                                />
                              </div>
                           </div>
                           <button 
                            onClick={(e) => { e.stopPropagation(); setEditingCard(card); setIsCardModalOpen(true); }}
                            className="h-10 w-10 glass-card rounded-2xl flex items-center justify-center opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all duration-300"
                           >
                            <Pencil className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Selected Card Dashboard ───────── */}
        {selectedCard && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            {/* Quick Invoice Summary */}
            <div className="px-6 sm:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
               {/* Main Invoice Card */}
               <div className="md:col-span-12 lg:col-span-8 glass-card rounded-[56px] p-12 relative overflow-hidden flex flex-col justify-between min-h-[300px] border-white/40 shadow-2xl">
                  {/* Selector Header */}
                  <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-3xl border border-white/50 backdrop-blur-md">
                      <button 
                        onClick={prevInvoice} 
                        className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-white hover:shadow-sm transition-all active:scale-90 text-slate-400 hover:text-slate-900"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <button 
                        onClick={goToToday}
                        className="flex items-center gap-3 px-6 h-10 group"
                      >
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">
                          {MONTH_NAMES[currentMonth-1]} {currentYear}
                        </span>
                        {currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear() && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                        )}
                      </button>

                      <button 
                        onClick={nextInvoice} 
                        className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-white hover:shadow-sm transition-all active:scale-90 text-slate-400 hover:text-slate-900"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Ciclo</p>
                      <div className="flex items-center gap-2">
                         <div className={cn("h-2 w-2 rounded-full", currentInvoiceStatus === 'ABERTA' ? 'bg-blue-500' : currentInvoiceStatus === 'PAGA' ? 'bg-emerald-500' : 'bg-rose-500')} />
                         <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{currentInvoiceStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10">
                    <div className="space-y-1">
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 px-1 opacity-60">Fatura do Período</p>
                      <motion.div 
                        key={invoiceTotal}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-baseline gap-3"
                      >
                        <span className="text-3xl font-black text-slate-300">R$</span>
                        <p className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                          {fmt(invoiceTotal).replace('R$', '').trim()}
                        </p>
                      </motion.div>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      <motion.button 
                        key={currentInvoiceStatus}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const statuses = ["ABERTA", "FECHADA", "PAGA"];
                          const next = statuses[(statuses.indexOf(currentInvoiceStatus) + 1) % statuses.length];
                          updateInvoiceStatus.mutate({ month: currentMonth, year: currentYear, status: next });
                        }}
                        className={cn(
                          "w-full sm:w-[240px] h-20 rounded-[32px] text-[13px] font-black uppercase tracking-[0.25em] transition-all shadow-2xl flex items-center justify-center gap-4 border-2 border-white/20",
                          currentInvoiceStatus === "PAGA" ? "bg-emerald-500 text-white shadow-emerald-200/40" :
                          currentInvoiceStatus === "FECHADA" ? "bg-rose-500 text-white shadow-rose-200/40" :
                          "bg-slate-900 text-white shadow-slate-300/40"
                        )}
                      >
                        {currentInvoiceStatus === "PAGA" && <CheckCircle2 className="h-5 w-5" />}
                        {currentInvoiceStatus === "FECHADA" && <Lock className="h-5 w-5" />}
                        {currentInvoiceStatus === "ABERTA" && <Unlock className="h-5 w-5" />}
                        Alterar Status
                      </motion.button>
                    </div>
                  </div>
               </div>

               {/* Stats Grid */}
               <div className="md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  <div className="glass-card rounded-[48px] p-10 flex flex-col justify-between group border-white/30">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-500" /> Limite Disponível
                      </p>
                      <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-4xl font-black text-slate-900 leading-none mb-3 tabular-nums tracking-tighter">
                        {fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount))}
                      </p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - (Number(selectedCard.usedAmount) / Number(selectedCard.limit) * 100))}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card rounded-[48px] p-10 flex flex-col justify-center space-y-8 border-white/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                          <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fechamento</span>
                          <span className="text-sm font-black text-slate-900">Todo dia {selectedCard.closingDay}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-px w-full bg-slate-100" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                          <Clock className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimento</span>
                          <span className="text-sm font-black text-slate-900">Todo dia {selectedCard.dueDay}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1 flex gap-4">
                    <Button 
                      onClick={() => setIsPayModalOpen(true)}
                      className="flex-1 h-20 rounded-[32px] bg-slate-900 hover:bg-black text-white font-black text-[12px] tracking-[0.2em] uppercase shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-2 border-white/10"
                    >
                      Pagar Fatura
                    </Button>
                    <button 
                      onClick={() => setIsLaunchModalOpen(true)}
                      className="h-20 w-20 glass-card rounded-[32px] flex items-center justify-center hover:bg-white hover:scale-105 transition-all text-slate-600 shadow-xl border-white/40"
                    >
                      <Plus className="h-8 w-8" />
                    </button>
                  </div>
               </div>
            </div>

            {/* ── Transaction List ──────────────── */}
            <div className="px-6 sm:px-12 space-y-8">
              <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <ArrowRightLeft className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Timeline da Fatura</h3>
                </div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-100 px-4 py-2 rounded-full">
                  {transactions.length} Atividades
                </span>
              </div>

              {isLoadingTx ? (
                <div className="h-60 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-24 glass-card rounded-[56px] text-center border-dashed border-2 border-slate-200 max-w-2xl mx-auto">
                  <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Clock className="h-10 w-10 text-slate-200" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Nada por aqui ainda</h4>
                  <p className="text-slate-400 font-medium text-sm px-10 mt-2">Nenhum lançamento foi encontrado para {MONTH_NAMES[currentMonth-1]} de {currentYear}.</p>
                </div>
              ) : (
                <motion.div 
                  initial="hidden" animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.08 } }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6"
                >
                  {transactions.map((tx) => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const color = cat?.color ?? "#94A3B8";
                    const isRefund = Number(tx.amount) < 0;

                    return (
                      <motion.div 
                        key={tx.id}
                        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                        className="group flex items-center gap-6 p-8 glass-card rounded-[44px] hover:bg-white hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all cursor-pointer border-white/20 active:scale-[0.98]"
                        onClick={() => { setEditingTx(tx); setIsEditModalOpen(true); }}
                      >
                        <div 
                          className="h-20 w-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] transition-all group-hover:rotate-6 bg-white/40"
                        >
                          <div 
                            className="h-14 w-14 rounded-[22px] flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: color }}
                          >
                            {isRefund ? (
                              <ArrowDownLeft className="h-7 w-7 text-white" />
                            ) : (
                              <TrendingDown className="h-7 w-7 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <p className="font-extrabold text-slate-900 text-lg tracking-tight truncate">{tx.description}</p>
                            {tx.launchType === 'installment' && (
                              <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border border-white/20">
                                {tx.currentInstallment}/{tx.totalInstallments}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {cat?.name ?? "Outros"}
                             </span>
                             <div className="h-1 w-1 rounded-full bg-slate-300" />
                             <p className="text-[11px] font-bold text-slate-400/80 uppercase tracking-tighter">
                                {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                             </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <p className={cn(
                            "font-black tabular-nums text-xl tracking-tighter",
                            isRefund ? "text-emerald-600" : "text-slate-900"
                          )}>
                            {isRefund ? `+${fmt(Math.abs(Number(tx.amount)))}` : fmt(Number(tx.amount))}
                          </p>
                          <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VISUALIZAR</span>
                             <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* --- MODAIS --- */}
      
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
    <Modal open={open} onClose={onClose} title={editingCard ? "Configurar Cartão" : "Vincular Novo Cartão"} size="md">
      <div className="space-y-6 pt-2">
        
        {/* Preview Card Mockup */}
        <div className={cn("w-full h-44 rounded-3xl p-6 text-white bg-gradient-to-br transition-all duration-500 flex flex-col shadow-xl", form.gradient || "from-slate-800 to-slate-900")}>
           <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">{form.bank || "Banco"}</span>
              <Wifi className="h-5 w-5 opacity-40 rotate-90" />
           </div>
           <div className="mt-auto">
              <p className="text-xl font-black">{form.name || "NOME DO CARTÃO"}</p>
              <p className="font-mono tracking-[0.2em] opacity-80 mt-1">•••• •••• •••• {form.lastDigits || "0000"}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição</label>
            <input value={form.bank} onChange={e => setForm((p: any) => ({...p, bank: e.target.value}))} placeholder="Ex: Nubank, Inter" className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-bold focus:bg-white transition-all outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apelido do Cartão</label>
            <input value={form.name} onChange={e => setForm((p: any) => ({...p, name: e.target.value}))} placeholder="Ex: Meu Cartão Principal" className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-bold focus:bg-white transition-all outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Finais</label>
            <input maxLength={4} value={form.lastDigits} onChange={e => setForm((p: any) => ({...p, lastDigits: e.target.value}))} placeholder="1234" className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-bold focus:bg-white transition-all outline-none text-center" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia Venc.</label>
            <input type="number" value={form.dueDay} onChange={e => setForm((p: any) => ({...p, dueDay: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-bold focus:bg-white transition-all outline-none text-center" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia Fech.</label>
            <input type="number" value={form.closingDay} onChange={e => setForm((p: any) => ({...p, closingDay: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-bold focus:bg-white transition-all outline-none text-center" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite Total (R$)</label>
          <input type="number" value={form.limit} onChange={e => setForm((p: any) => ({...p, limit: e.target.value}))} placeholder="Ex: 5000.00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 text-sm font-black text-lg focus:bg-white transition-all outline-none" />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estilo do Cartão</label>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map(preset => (
              <button 
                key={preset.value}
                onClick={() => setForm((p: any) => ({...p, gradient: preset.value, color: preset.color}))}
                className={cn(
                  "h-10 w-10 rounded-xl bg-gradient-to-br transition-all",
                  preset.value,
                  form.gradient === preset.value ? "ring-4 ring-emerald-500/20 ring-offset-2 scale-110 shadow-lg" : "opacity-30 hover:opacity-100"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
           <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl h-12 font-bold text-slate-500">Cancelar</Button>
           <Button 
            onClick={handleSubmit}
            className="flex-3 w-44 rounded-2xl h-12 bg-slate-900 font-black"
            disabled={createCard.isPending || updateCard.isPending}
          >
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
    categoryId: "", launchType: "single", totalInstallments: "2", isPending: false,
    invoiceMonth: currentMonth, invoiceYear: currentYear
  });

  const { data: categories = [] } = useCategories();
  const createTx = useCreateCardTransaction(selectedCard?.id || "");

  const handleDateChange = (date: string) => {
    const suggested = getSuggestedInvoice(selectedCard, date);
    setForm(p => ({ 
      ...p, 
      date, 
      invoiceMonth: suggested.month, 
      invoiceYear: suggested.year 
    }));
  };

  React.useEffect(() => {
    if (open) {
      const suggested = getSuggestedInvoice(selectedCard, form.date);
      setForm(p => ({ ...p, invoiceMonth: suggested.month, invoiceYear: suggested.year }));
    }
  }, [open, selectedCard]);

  const handleSubmit = () => {
    const isRefund = form.type === 'refund';
    const amountVal = Math.abs(Number(form.amount)) * (isRefund ? -1 : 1);
    
    createTx.mutate({
      ...form,
      amount: amountVal,
      categoryId: form.categoryId || undefined,
    }, { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Lançamento" size="lg">
      <div className="space-y-6 pt-4">
        
        {/* Toggle Tipo */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setForm(p => ({...p, type: 'purchase'}))}
            className={cn("flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all", form.type === 'purchase' ? "bg-white text-rose-600 shadow-sm" : "text-slate-400")}
          >
            <TrendingDown className="h-4 w-4" /> COMPRA
          </button>
          <button 
            onClick={() => setForm(p => ({...p, type: 'refund'}))}
            className={cn("flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all", form.type === 'refund' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
          >
            <ArrowDownLeft className="h-4 w-4" /> ESTORNO
          </button>
        </div>

        {/* Valor Input */}
        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Valor do {form.type === 'purchase' ? 'Gasto' : 'Crédito'}</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-300">R$</span>
            <input 
              autoFocus
              type="number" 
              value={form.amount}
              onChange={e => setForm(p => ({...p, amount: e.target.value}))}
              placeholder="0,00"
              className="text-5xl font-black w-full bg-transparent border-0 focus:ring-0 placeholder:text-slate-200 tabular-nums text-center"
            />
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label>
              <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Ex: Supermercado, Netflix..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none focus:bg-white transition-all" />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({...p, categoryId: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none">
                  <option value="">Geral / Sem Categoria</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data da Operação</label>
                <input type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none focus:bg-white transition-all shadow-sm" />
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fatura de Destino</label>
                  <p className="text-[9px] text-emerald-600 font-bold italic">* Calculado pelo fechamento do cartão</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={form.invoiceMonth} 
                    onChange={e => setForm(p => ({...p, invoiceMonth: Number(e.target.value)}))}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none appearance-none focus:bg-white transition-all"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>{name}</option>
                    ))}
                  </select>
                  <select 
                    value={form.invoiceYear} 
                    onChange={e => setForm(p => ({...p, invoiceYear: Number(e.target.value)}))}
                    className="w-28 bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none appearance-none focus:bg-white transition-all"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Lançamento</label>
                <select value={form.launchType} onChange={e => setForm(p => ({...p, launchType: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none">
                  <option value="single">À Vista</option>
                  <option value="installment" disabled={form.type === 'refund'}>Parcelado</option>
                  <option value="fixed" disabled={form.type === 'refund'}>Fixo / Mensal</option>
                </select>
              </div>
              {form.launchType === 'installment' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nº Parcelas</label>
                  <input type="number" min={2} value={form.totalInstallments} onChange={e => setForm(p => ({...p, totalInstallments: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 font-bold text-sm outline-none" />
                </div>
              )}
           </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-100">
           <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl h-14 font-black text-slate-400">Cancelar</Button>
           <Button 
            onClick={handleSubmit}
            className="flex-2 w-full max-w-[200px] rounded-2xl h-14 bg-slate-900 font-black shadow-xl shadow-slate-200"
            disabled={!form.amount || !form.description || createTx.isPending}
          >
            {createTx.isPending ? "Lançando..." : "Criar Lançamento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PayInvoiceModal({ open, onClose, card, total, accounts, month, year }: any) {
  const [form, setForm] = useState({ accountId: "", amount: String(total), date: new Date().toISOString().split('T')[0] });
  const payInvoice = usePayCardInvoice();

  React.useEffect(() => { if(open) setForm(p => ({...p, amount: String(total || 0) }))}, [open, total]);

  const handlePay = () => {
    payInvoice.mutate({
      cardId: card.id,
      accountId: form.accountId,
      amount: Number(form.amount),
      description: `Fatura ${card.name}`,
      date: form.date,
      month,
      year
    }, { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title="Liquidar Fatura" size="md">
      <div className="space-y-6 pt-4 text-center">
        <div className="h-20 w-20 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-900">Confirmar Pagamento</h4>
          <p className="text-slate-400 font-medium">Você está registrando o pagamento da fatura do {card?.name}.</p>
        </div>

        <div className="bg-slate-50 rounded-[32px] p-6 text-center space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Pagamento</p>
          <p className="text-3xl font-black text-slate-900">{fmt(Number(form.amount))}</p>
        </div>

        <div className="space-y-4 text-left">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Origem dos Recursos</label>
              <select value={form.accountId} onChange={e => setForm(p => ({...p, accountId: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-4 font-black transition-all outline-none">
                <option value="">Selecione a conta...</option>
                {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.name} ({fmt(Number(acc.balance))})</option>)}
              </select>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data do Pagamento</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-4 font-black outline-none" />
           </div>
        </div>

        <Button 
          onClick={handlePay}
          disabled={!form.accountId || payInvoice.isPending}
          className="w-full h-16 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02]"
        >
          {payInvoice.isPending ? "Processando..." : "Confirmar e Liquidar"}
        </Button>
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
    if (window.confirm("Deseja realmente excluir este lançamento? Esta ação não pode ser desfeita.")) {
      deleteTx.mutate(tx.id, { onSuccess: onClose });
    }
  };

  if (!tx) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar Lançamento" size="md">
      <div className="space-y-6 pt-4">
        
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase">Descrição</label>
             <input value={form.description} onChange={e => setForm((p: any) => ({...p, description: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 font-bold text-sm outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase">Valor (BRL)</label>
             <input type="number" value={form.amount} onChange={e => setForm((p: any) => ({...p, amount: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 font-black" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase">Categoria</label>
             <select value={form.categoryId} onChange={e => setForm((p: any) => ({...p, categoryId: e.target.value}))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 px-4 font-bold text-sm outline-none">
                <option value="">Sem Categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
           <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Fatura de Destino</label>
           <div className="grid grid-cols-2 gap-3">
              <select value={form.invoiceMonth} onChange={e => setForm((p: any) => ({...p, invoiceMonth: Number(e.target.value)}))} className="bg-white border-blue-200 rounded-xl px-2 py-2 text-xs font-bold font-black outline-none">
                {MONTH_NAMES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
              <input type="number" value={form.invoiceYear} onChange={e => setForm((p: any) => ({...p, invoiceYear: Number(e.target.value)}))} className="bg-white border-blue-200 rounded-xl px-2 py-2 text-xs font-bold font-black outline-none" />
           </div>
        </div>

        {tx.groupId && (
          <div className="p-4 bg-amber-50 rounded-[28px] border border-amber-100 flex items-center justify-between group">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ArrowRightLeft className={cn("h-4 w-4 text-amber-500 transition-transform", updateGroup && "rotate-180")} />
                </div>
                <div>
                   <p className="text-xs font-black text-amber-900 leading-tight">Edição Vincunlada</p>
                   <p className="text-[10px] text-amber-600 font-medium">Aplicar em {tx.launchType === 'installment' ? 'parcelas seguintes' : 'todos os itens do grupo'}?</p>
                </div>
             </div>
             <button 
              onClick={() => setUpdateGroup(!updateGroup)}
              className={cn("h-6 w-12 rounded-full transition-all relative", updateGroup ? "bg-amber-500" : "bg-slate-200")}
             >
                <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-sm", updateGroup ? "right-1" : "left-1")} />
             </button>
          </div>
        )}

        <div className="flex gap-2 pt-6">
           <Button variant="ghost" onClick={handleDelete} className="p-0 h-14 w-14 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500">
             <Trash2 className="h-5 w-5" />
           </Button>
           <Button 
            onClick={handleUpdate}
            className="flex-1 h-14 rounded-2xl bg-slate-900 font-black shadow-xl shadow-slate-200"
            disabled={updateTx.isPending}
          >
            {updateTx.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
