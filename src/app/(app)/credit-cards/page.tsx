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
  Wifi,
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  X,
  Target
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

  if (isLoadingCards) return <div className="p-8 text-slate-400">Carregando cartões...</div>;

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 sm:px-8 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meus Cartões</h1>
          <p className="text-slate-500 font-medium">Gerencie faturas, limites e parcelamentos em um só lugar.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }}
            className="rounded-2xl h-12 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Cartão
          </Button>
          <Button 
            onClick={() => setIsLaunchModalOpen(true)}
            disabled={!selectedCard}
            className="rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-center">
          <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-4">
            <CardIcon className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Nenhum cartão cadastrado</h3>
          <p className="text-slate-500 max-w-xs mt-2">Adicione seu primeiro cartão de crédito para começar a controlar seus gastos parcelados.</p>
          <Button onClick={() => setIsCardModalOpen(true)} className="mt-6 rounded-2xl px-8 h-12 bg-slate-900">Cadastrar Cartão</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna Esquerda: Cartões e Stats */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            
            {/* Scroll de Cartões */}
            <div className="flex xl:flex-col gap-4 overflow-x-auto pb-4 xl:pb-0 no-scrollbar">
              {cards.map((card) => (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCardId(card.id)}
                  className={cn(
                    "relative min-w-[320px] xl:min-w-0 w-full h-52 rounded-[32px] p-6 text-white text-left transition-all duration-500 overflow-hidden group",
                    card.gradient ? `bg-gradient-to-br ${card.gradient}` : "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700",
                    selectedCardId === card.id ? "shadow-2xl shadow-slate-200 ring-4 ring-white/30 scale-[1.02]" : "opacity-80 scale-[0.98] saturate-[0.5]"
                  )}
                >
                  {/* Glass Effect */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">{card.bank}</p>
                      <h4 className="text-xl font-black leading-tight truncate max-w-[180px]">{card.name}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Wifi className="h-5 w-5 text-white/50 rotate-90" />
                      <NetworkLogo network={card.network} />
                    </div>
                  </div>

                  <div className="mt-8 relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-8 w-11 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg shadow-inner opacity-80" />
                      <p className="font-mono text-lg tracking-[0.2em] text-white/90">•••• {card.lastDigits}</p>
                    </div>
                  </div>

                  <div className="mt-auto relative z-10 pt-4">
                    <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase mb-1.5">
                      <span>Uso de Limite</span>
                      <span>{Math.round((Number(card.usedAmount) / Number(card.limit)) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((Number(card.usedAmount) / Number(card.limit)) * 100, 100)}%` }}
                        className={cn(
                          "h-full rounded-full",
                          (Number(card.usedAmount) / Number(card.limit)) > 0.8 ? "bg-rose-400" : "bg-emerald-400"
                        )}
                      />
                    </div>
                  </div>

                  {/* Constant Edit Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingCard(card); setIsCardModalOpen(true); }}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-xl transition-all backdrop-blur-md border border-white/20"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </motion.button>
              ))}
            </div>

            {/* Quick Actions & Stats Card */}
            {selectedCard && (
              <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite Disponível</p>
                    <p className="text-xl font-black text-slate-900">{fmt(Number(selectedCard.limit) - Number(selectedCard.usedAmount))}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimento</p>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Dia {selectedCard.dueDay}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fechamento</p>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Dia {selectedCard.closingDay}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setIsPayModalOpen(true)}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold group"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2 transition-transform group-hover:rotate-180 duration-500" /> 
                  Pagar Fatura
                </Button>
              </div>
            )}
          </div>

          {/* Coluna Direita: Timeline e Lançamentos */}
          <div className="lg:col-span-12 xl:col-span-8 space-y-6">
            
            {/* Invoice Timeline */}
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-900 rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Fatura de {MONTH_NAMES[currentMonth - 1]}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{currentYear}</p>
                  </div>
                </div>
                
                <div className="flex items-center bg-slate-50 rounded-[24px] p-1 border border-slate-100">
                  <button onClick={prevInvoice} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                  <button 
                    onClick={goToToday}
                    className="px-6 text-[10px] font-black text-slate-900 border-x border-slate-200 hover:text-emerald-600 transition-all uppercase tracking-widest flex flex-col items-center gap-0.5 group"
                  >
                    <span className="text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">{currentYear}</span>
                    <span className="group-hover:scale-110 transition-transform">{MONTH_NAMES[currentMonth - 1]}</span>
                  </button>
                  <button onClick={nextInvoice} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-rose-50 rounded-[32px] border border-rose-100/50">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Valor da Fatura</p>
                  <p className="text-3xl font-black text-rose-600">{fmt(invoiceTotal)}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-500">
                    <TrendingDown className="h-4 w-4" />
                    <span>Total de {transactions.length} lançamentos</span>
                  </div>
                </div>
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado</p>
                    <div className="flex items-center gap-2">
                       <AnimatePresence mode="wait">
                        <motion.button 
                          key={currentInvoiceStatus}
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const statuses = ["ABERTA", "FECHADA", "PAGA"];
                            const next = statuses[(statuses.indexOf(currentInvoiceStatus) + 1) % statuses.length];
                            updateInvoiceStatus.mutate({ month: currentMonth, year: currentYear, status: next });
                          }}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:shadow-inner",
                            currentInvoiceStatus === "PAGA" ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                            currentInvoiceStatus === "FECHADA" ? "bg-rose-100 text-rose-600 border border-rose-200" :
                            "bg-blue-100 text-blue-600 border border-blue-200"
                          )}
                        >
                          {currentInvoiceStatus}
                        </motion.button>
                       </AnimatePresence>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacto em Orçamentos</p>
                    <p className="text-lg font-black text-slate-700">Moderado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Transactions */}
            <div className="bg-white rounded-[40px] p-4 sm:p-8 border border-slate-100 shadow-sm min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Detalhes dos Lançamentos</h3>
                <div className="flex gap-2">
                  {/* Search/Filters placeholder */}
                </div>
              </div>

              {isLoadingTx ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 border-4 border-slate-100 border-t-emerald-500 rounded-full" 
                  />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Buscando faturas...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">Nenhum gasto nesta fatura.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.map((tx) => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const color = cat?.color ?? "#94A3B8";
                    const isRefund = Number(tx.amount) < 0;

                    return (
                      <motion.div 
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        className="group flex items-center gap-4 p-4 rounded-[24px] hover:bg-slate-50 transition-all cursor-pointer relative"
                        onClick={() => { setEditingTx(tx); setIsEditModalOpen(true); }}
                      >
                        <div 
                          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          {isRefund ? <ArrowDownLeft className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5" style={{ color }} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 truncate">{tx.description}</p>
                            {tx.isPending && <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-100">Pendente</span>}
                            {tx.launchType === 'installment' && <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100">{tx.currentInstallment}/{tx.totalInstallments}x</span>}
                            {tx.isFixed && <span className="bg-violet-50 text-violet-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-violet-100">Fixo</span>}
                          </div>
                          <p className="text-xs font-bold text-slate-400 capitalize">
                            {cat?.name ?? "Geral"} • {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={cn(
                            "font-black tabular-nums",
                            isRefund ? "text-emerald-600" : "text-slate-900"
                          )}>
                            {isRefund ? `+${fmt(Math.abs(Number(tx.amount)))}` : `-${fmt(Number(tx.amount))}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">BRL</p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                           <MoreVertical className="h-4 w-4 text-slate-300" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
