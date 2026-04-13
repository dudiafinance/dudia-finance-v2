"use client";

import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useUpdateInvoiceStatus } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type CreditCard = {
  id: string;
  name: string;
  bank: string;
  limit: number | string;
  usedAmount?: number | string;
  dueDay: number | string;
  closingDay: number | string;
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface InvoiceDetailsProps {
  card: CreditCard;
  currentMonth: number;
  currentYear: number;
  invoiceTotal: number;
  invoiceStatus: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onPayInvoice: () => void;
  onLaunchTransaction: () => void;
  fmt: (v: number) => string;
}

export function InvoiceDetails({
  card,
  currentMonth,
  currentYear,
  invoiceTotal,
  invoiceStatus,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onPayInvoice,
  onLaunchTransaction,
  fmt,
}: InvoiceDetailsProps) {
  const { toast } = useToast();
  const updateInvoiceStatus = useUpdateInvoiceStatus(card.id);

  const isCurrentMonth = currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();
  const availableLimit = Number(card.limit) - Number(card.usedAmount);

  const cycleStatus = (status: string) => {
    const statuses = ["ABERTA", "FECHADA", "PAGA"];
    const next = statuses[(statuses.indexOf(status) + 1) % statuses.length];
    updateInvoiceStatus.mutate({ month: currentMonth, year: currentYear, status: next }, {
      onSuccess: () => toast(`Status atualizado para ${next}`)
    });
  };

  return (
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
              onClick={onPrevMonth} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button 
              onClick={onGoToToday}
              className="px-4 h-8 text-[11px] font-bold uppercase text-foreground flex items-center gap-2"
            >
              {MONTH_NAMES[currentMonth-1]} {currentYear}
              {isCurrentMonth && (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onNextMonth} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onPayInvoice}
              className="h-9 px-6 text-[11px] font-bold uppercase border-border shadow-precision"
            >
              Liquidar Fatura
            </Button>
            <Button 
              onClick={onLaunchTransaction}
              className="h-9 px-6 text-[11px] font-bold uppercase shadow-precision"
            >
              <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
              {fmt(availableLimit)}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fechamento</p>
            <p className="text-sm font-bold text-foreground uppercase tracking-tight">Dia {card.closingDay}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vencimento</p>
            <p className="text-sm font-bold text-foreground uppercase tracking-tight">Dia {card.dueDay}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Button
          variant={invoiceStatus === "PAGA" ? "secondary" : "default"}
          onClick={() => cycleStatus(invoiceStatus)}
          className={cn(
            "h-14 px-10 text-[12px] font-bold uppercase tracking-[0.2em] transition-all shadow-precision border-precision border-white/5",
            invoiceStatus === "PAGA" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" :
            invoiceStatus === "FECHADA" ? "bg-red-500 text-white hover:bg-red-600" :
            "bg-foreground text-background"
          )}
        >
          {invoiceStatus === "PAGA" && <CheckCircle2 className="h-4 w-4 mr-3" />}
          {invoiceStatus === "ABERTA" ? "Fechar Fatura" : invoiceStatus === "FECHADA" ? "Confirmar Pagamento" : "Fatura Liquidada"}
        </Button>
      </div>
    </section>
  );
}
