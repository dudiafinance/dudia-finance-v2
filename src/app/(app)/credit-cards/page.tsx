"use client";

import { useState } from "react";
import {
  CreditCard,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Calendar,
  Lock,
  Wifi,
  MoreHorizontal,
  TrendingUp,
  ShoppingBag,
  Utensils,
  Car,
  Heart,
  Film,
  Book,
  Home,
  HelpCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockCreditCards, mockCardInvoices, mockCategories } from "@/lib/mock-data";
import { CreditCard as CreditCardType, CardTransaction } from "@/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "1": TrendingUp,
  "4": Utensils,
  "5": Car,
  "6": Home,
  "7": Film,
  "8": Heart,
  "9": Book,
  "10": ShoppingBag,
};

function getCategoryIcon(categoryId: string) {
  return CATEGORY_ICONS[categoryId] ?? HelpCircle;
}

function getCategoryName(categoryId: string) {
  return mockCategories.find((c) => c.id === categoryId)?.name ?? "Outros";
}

function getCategoryColor(categoryId: string) {
  return mockCategories.find((c) => c.id === categoryId)?.color ?? "#64748B";
}

// ──────────────────────────────────────────────────────────
// Visual card component
// ──────────────────────────────────────────────────────────
function CardVisual({ card, selected, onClick }: { card: CreditCardType; selected: boolean; onClick: () => void }) {
  const usedPct = (card.usedAmount / card.limit) * 100;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full max-w-sm rounded-2xl p-6 text-white shadow-lg transition-all duration-300 cursor-pointer select-none",
        `bg-gradient-to-br ${card.gradient}`,
        selected ? "ring-4 ring-white/40 scale-[1.02]" : "opacity-80 hover:opacity-100"
      )}
    >
      {/* top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/70">Banco</p>
          <p className="text-lg font-bold">{card.bank}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Wifi className="h-5 w-5 rotate-90 text-white/80" />
          <NetworkLogo network={card.network} />
        </div>
      </div>

      {/* chip + number */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-8 w-12 rounded-md bg-yellow-300/80" />
        <p className="text-lg font-mono tracking-widest text-white/90">
          •••• •••• •••• {card.lastDigits}
        </p>
      </div>

      {/* card name */}
      <p className="mt-4 text-sm font-semibold text-white/90">{card.name}</p>

      {/* usage bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>{fmt(card.usedAmount)} usados</span>
          <span>Limite {fmt(card.limit)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/20">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              usedPct > 80 ? "bg-red-400" : usedPct > 50 ? "bg-yellow-300" : "bg-emerald-400"
            )}
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-white/70">
          {fmt(card.limit - card.usedAmount)} disponível
        </p>
      </div>
    </button>
  );
}

function NetworkLogo({ network }: { network: CreditCardType["network"] }) {
  const labels: Record<string, string> = {
    visa: "VISA",
    mastercard: "MC",
    elo: "ELO",
    amex: "AMEX",
    hipercard: "HIPER",
  };
  return (
    <span className="text-xs font-bold tracking-widest text-white/90">
      {labels[network]}
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// Transaction row
// ──────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: CardTransaction }) {
  const Icon = getCategoryIcon(tx.categoryId);
  const color = getCategoryColor(tx.categoryId);
  const catName = getCategoryName(tx.categoryId);

  return (
    <div className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
          {tx.isPending && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              Pendente
            </span>
          )}
          {tx.installments && (
            <span className="shrink-0 text-xs text-slate-400">
              {tx.currentInstallment}/{tx.installments}x
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {catName} · {tx.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-red-600">
        -{fmt(tx.amount)}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────
export default function CreditCardsPage() {
  const [selectedCardId, setSelectedCardId] = useState(mockCreditCards[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "invoices" | "analytics">("transactions");

  const card = mockCreditCards.find((c) => c.id === selectedCardId)!;
  const invoice = mockCardInvoices.find((i) => i.cardId === selectedCardId && i.status === "open");
  const pastInvoices = mockCardInvoices.filter((i) => i.cardId === selectedCardId && i.status !== "open");

  const transactions = invoice?.transactions ?? [];
  const filtered = transactions.filter((t) =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Analytics data
  const byCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    const name = getCategoryName(tx.categoryId);
    acc[name] = (acc[name] ?? 0) + tx.amount;
    return acc;
  }, {});
  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const invoiceHistory = [
    ...pastInvoices.slice(0, 5).map((i) => ({ month: `${i.month.slice(0, 3)}/${i.year.toString().slice(2)}`, value: i.total })),
  ].reverse();
  if (invoice) invoiceHistory.push({ month: `${invoice.month.slice(0, 3)}/26`, value: invoice.total });

  const totalCards = mockCreditCards.length;
  const totalLimit = mockCreditCards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = mockCreditCards.reduce((s, c) => s + c.usedAmount, 0);
  const totalAvailable = totalLimit - totalUsed;

  // Due date info
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
  if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  const closingDate = new Date(today.getFullYear(), today.getMonth(), card.closingDay);
  if (closingDate < today) closingDate.setMonth(closingDate.getMonth() + 1);
  const daysUntilClosing = Math.ceil((closingDate.getTime() - today.getTime()) / 86400000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cartões de Crédito</h1>
          <p className="text-sm text-slate-500">{totalCards} cartões · {fmt(totalAvailable)} disponível</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Limite Total", value: fmt(totalLimit), icon: CreditCard, color: "blue" },
          { label: "Total Utilizado", value: fmt(totalUsed), icon: ArrowUpRight, color: "red" },
          { label: "Disponível", value: fmt(totalAvailable), icon: CheckCircle2, color: "emerald" },
          { label: "% do Limite", value: `${((totalUsed / totalLimit) * 100).toFixed(1)}%`, icon: BarChart3, color: "violet" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", {
                "bg-blue-50 text-blue-600": color === "blue",
                "bg-red-50 text-red-600": color === "red",
                "bg-emerald-50 text-emerald-600": color === "emerald",
                "bg-violet-50 text-violet-600": color === "violet",
              })}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className={cn("mt-2 text-xl font-bold", {
              "text-slate-900": color === "blue" || color === "emerald",
              "text-red-600": color === "red",
              "text-violet-600": color === "violet",
            })}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left – card carousel + details */}
        <div className="xl:col-span-1 space-y-4">
          {/* Card selector */}
          <div className="space-y-3">
            {mockCreditCards.map((c) => (
              <CardVisual
                key={c.id}
                card={c}
                selected={c.id === selectedCardId}
                onClick={() => setSelectedCardId(c.id)}
              />
            ))}
          </div>

          {/* Card info panel */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Informações do Cartão</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                {
                  label: "Vencimento",
                  value: `Dia ${card.dueDay}`,
                  sub: daysUntilDue <= 5
                    ? `⚠ Vence em ${daysUntilDue} dias`
                    : `Em ${daysUntilDue} dias`,
                  icon: Calendar,
                  alert: daysUntilDue <= 5,
                },
                {
                  label: "Fechamento",
                  value: `Dia ${card.closingDay}`,
                  sub: `Fecha em ${daysUntilClosing} dias`,
                  icon: Lock,
                  alert: false,
                },
                {
                  label: "Fatura Atual",
                  value: fmt(invoice?.total ?? 0),
                  sub: invoice?.status === "open" ? "Em aberto" : "Fechada",
                  icon: CreditCard,
                  alert: false,
                },
                {
                  label: "Limite Disponível",
                  value: fmt(card.limit - card.usedAmount),
                  sub: `${(((card.limit - card.usedAmount) / card.limit) * 100).toFixed(0)}% do limite`,
                  icon: CheckCircle2,
                  alert: false,
                },
              ].map(({ label, value, sub, icon: Icon, alert }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", alert ? "bg-amber-50" : "bg-slate-50")}>
                    <Icon className={cn("h-4 w-4", alert ? "text-amber-600" : "text-slate-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                  <p className={cn("text-xs font-medium", alert ? "text-amber-600" : "text-slate-400")}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right – tabs content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["transactions", "invoices", "analytics"] as const).map((tab) => {
              const labels = { transactions: "Transações", invoices: "Faturas", analytics: "Análise" };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* ── Transactions tab ── */}
          {activeTab === "transactions" && (
            <div className="rounded-xl bg-white shadow-sm border border-slate-100">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Fatura {invoice?.month} {invoice?.year}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {transactions.length} transações · {fmt(invoice?.total ?? 0)}
                  </p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  invoice?.status === "open"
                    ? "bg-amber-100 text-amber-700"
                    : invoice?.status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                )}>
                  {invoice?.status === "open" ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {invoice?.status === "open" ? "Em aberto" : invoice?.status === "paid" ? "Paga" : "Fechada"}
                </span>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-slate-50">
                <input
                  type="text"
                  placeholder="Buscar transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* List */}
              <div className="divide-y divide-slate-50 px-2 py-2 max-h-[480px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">Nenhuma transação encontrada</p>
                ) : (
                  filtered
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((tx) => <TxRow key={tx.id} tx={tx} />)
                )}
              </div>

              {/* Footer total */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-amber-600">
                    {transactions.filter((t) => t.isPending).length} pendentes
                  </span>
                  {" · "}
                  <span>{transactions.filter((t) => !t.isPending).length} confirmadas</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total da fatura</p>
                  <p className="text-lg font-bold text-red-600">{fmt(invoice?.total ?? 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Invoices tab ── */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              {/* Current invoice highlight */}
              {invoice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-700">Fatura Atual</p>
                      <p className="text-2xl font-bold text-amber-800">{fmt(invoice.total)}</p>
                      <p className="text-sm text-amber-600 mt-1">
                        Vence em {daysUntilDue} dias · dia {card.dueDay}/{(dueDate.getMonth() + 1).toString().padStart(2, "0")}
                      </p>
                    </div>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Pagar Fatura
                    </Button>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-amber-200">
                    <div
                      className="h-1.5 rounded-full bg-amber-500"
                      style={{ width: `${Math.min((card.usedAmount / card.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-amber-600">
                    <span>{((card.usedAmount / card.limit) * 100).toFixed(1)}% do limite usado</span>
                    <span>{fmt(card.limit - card.usedAmount)} disponível</span>
                  </div>
                </div>
              )}

              {/* Past invoices */}
              <div className="rounded-xl bg-white shadow-sm border border-slate-100">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Histórico de Faturas</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {pastInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <Calendar className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{inv.month} {inv.year}</p>
                          <p className="text-xs text-slate-400">
                            Venceu em {inv.dueDate.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{fmt(inv.total)}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Paga
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice history chart */}
              <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Evolução das Faturas</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={invoiceHistory} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Fatura"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill={card.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Analytics tab ── */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              {/* Spending by category chart */}
              <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-1">Gastos por Categoria</h3>
                <p className="text-xs text-slate-400 mb-4">Fatura atual</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v)), "Gasto"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill={card.color} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown list */}
              <div className="rounded-xl bg-white shadow-sm border border-slate-100">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Detalhamento por Categoria</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {chartData.map(({ name, value }) => {
                    const cat = mockCategories.find((c) => c.name === name);
                    const Icon = cat ? getCategoryIcon(cat.id) : HelpCircle;
                    const color = cat?.color ?? "#64748B";
                    const pct = ((value / (invoice?.total ?? 1)) * 100).toFixed(1);
                    return (
                      <div key={name} className="flex items-center gap-4 px-5 py-3.5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${color}18` }}
                        >
                          <Icon className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-700">{name}</p>
                            <p className="text-sm font-semibold text-slate-800">{fmt(value)}</p>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                        <p className="shrink-0 text-xs text-slate-400 w-10 text-right">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Maior gasto", value: fmt(Math.max(...transactions.map((t) => t.amount))), sub: transactions.sort((a, b) => b.amount - a.amount)[0]?.description ?? "-" },
                  { label: "Ticket médio", value: fmt(transactions.length ? (invoice?.total ?? 0) / transactions.length : 0), sub: `${transactions.length} transações` },
                  { label: "Parcelamentos", value: fmt(transactions.filter((t) => t.installments).reduce((s, t) => s + t.amount, 0)), sub: `${transactions.filter((t) => t.installments).length} parcelas` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-xl bg-white shadow-sm border border-slate-100 p-4">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-slate-400 truncate">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
