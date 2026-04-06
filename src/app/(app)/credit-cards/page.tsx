"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Calendar,
  Lock,
  Wifi,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TagInput } from "@/components/ui/tag-input";
import { useCategories, useTags } from "@/hooks/use-api";
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

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro na requisição");
  return data as T;
}

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const GRADIENT_PRESETS = [
  { label: "Roxo",    value: "from-[#820AD1] to-[#4B0082]", color: "#820AD1" },
  { label: "Azul",   value: "from-[#1D4ED8] to-[#1E3A8A]", color: "#1D4ED8" },
  { label: "Verde",  value: "from-[#059669] to-[#065F46]", color: "#059669" },
  { label: "Rosa",   value: "from-[#DB2777] to-[#831843]", color: "#DB2777" },
  { label: "Laranja",value: "from-[#EA580C] to-[#7C2D12]", color: "#EA580C" },
  { label: "Slate",  value: "from-[#475569] to-[#1E293B]", color: "#475569" },
];

// ─── CardVisual ──────────────────────────────────────────────────────────────
function NetworkLogo({ network }: { network: string }) {
  const labels: Record<string, string> = {
    visa: "VISA", mastercard: "MC", elo: "ELO", amex: "AMEX", hipercard: "HIPER",
  };
  return <span className="text-xs font-bold tracking-widest text-white/90">{labels[network] ?? network.toUpperCase()}</span>;
}

function CardVisual({ card, selected, onClick, onEdit }: { card: any; selected: boolean; onClick: () => void; onEdit?: (e: React.MouseEvent) => void }) {
  const limit = Number(card.limit);
  const used = Number(card.usedAmount);
  const usedPct = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full max-w-sm rounded-2xl p-6 text-white shadow-lg transition-all duration-300 cursor-pointer select-none",
        `bg-gradient-to-br ${card.gradient}`,
        selected ? "ring-4 ring-white/40 scale-[1.02]" : "opacity-80 hover:opacity-100"
      )}
    >
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
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
      <div className="mt-6 flex items-center gap-3">
        <div className="h-8 w-12 rounded-md bg-yellow-300/80" />
        <p className="text-lg font-mono tracking-widest text-white/90">
          •••• •••• •••• {card.lastDigits ?? "????"}
        </p>
      </div>
      <p className="mt-4 text-sm font-semibold text-white/90">{card.name}</p>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>{fmt(used)} usados</span>
          <span>Limite {fmt(limit)}</span>
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
        <p className="mt-1 text-right text-xs text-white/70">{fmt(limit - used)} disponível</p>
      </div>
    </button>
  );
}

// ─── TxRow ───────────────────────────────────────────────────────────────────
function TxRow({ tx, categories, onDelete }: { tx: any; categories: any[]; onDelete: (id: string) => void }) {
  const cat = categories.find((c: any) => c.id === tx.categoryId);
  const color = cat?.color ?? "#64748B";

  return (
    <div className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18` }}
      >
        <HelpCircle className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
          {tx.isPending && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />Pendente
            </span>
          )}
          {tx.currentInstallment && tx.totalInstallments && (
            <span className="shrink-0 text-xs text-slate-400">
              {tx.currentInstallment}/{tx.totalInstallments}x
            </span>
          )}
          {tx.isFixed && (
            <span className="shrink-0 text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">Fixo</span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {cat?.name ?? "Outros"} · {tx.date}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-red-600">-{fmt(Number(tx.amount))}</p>
      <button
        onClick={() => onDelete(tx.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── CardFormModal ────────────────────────────────────────────────────────────
function CardFormModal({ open, onClose, onSaved, editingCard }: { open: boolean; onClose: () => void; onSaved: () => void; editingCard?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", bank: "", lastDigits: "", limit: "", dueDay: "", closingDay: "",
    gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
  });

  React.useEffect(() => {
    if (editingCard) {
      setForm({
        name: editingCard.name || "",
        bank: editingCard.bank || "",
        lastDigits: editingCard.lastDigits || "",
        limit: String(editingCard.limit || ""),
        dueDay: String(editingCard.dueDay || ""),
        closingDay: String(editingCard.closingDay || ""),
        gradient: editingCard.gradient || GRADIENT_PRESETS[0].value,
        color: editingCard.color || GRADIENT_PRESETS[0].color,
        network: editingCard.network || "mastercard",
      });
    } else {
      setForm({
        name: "", bank: "", lastDigits: "", limit: "", dueDay: "", closingDay: "",
        gradient: GRADIENT_PRESETS[0].value, color: GRADIENT_PRESETS[0].color, network: "mastercard",
      });
    }
  }, [editingCard, open]);

  const createCard = useMutation({
    mutationFn: (data: any) => apiFetch("/api/credit-cards", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["credit-cards"] }); onSaved(); onClose(); },
  });

  const updateCard = useMutation({
    mutationFn: (data: any) => apiFetch(`/api/credit-cards/${editingCard.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["credit-cards"] }); onSaved(); onClose(); },
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={editingCard ? "Editar Cartão" : "Novo Cartão"} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Cartão *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Nubank Gold" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Banco *</label>
            <input value={form.bank} onChange={e => set("bank", e.target.value)} placeholder="Ex: Nubank" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">4 últimos dígitos</label>
            <input value={form.lastDigits} onChange={e => set("lastDigits", e.target.value.slice(0,4))} placeholder="1234" maxLength={4} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dia Vencimento *</label>
            <input type="number" min={1} max={31} value={form.dueDay} onChange={e => set("dueDay", e.target.value)} placeholder="10" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dia Fechamento *</label>
            <input type="number" min={1} max={31} value={form.closingDay} onChange={e => set("closingDay", e.target.value)} placeholder="3" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Limite (R$) *</label>
          <input type="number" step="0.01" value={form.limit} onChange={e => set("limit", e.target.value)} placeholder="5000.00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bandeira</label>
          <div className="flex gap-2 flex-wrap">
            {["visa", "mastercard", "elo", "amex", "hipercard"].map(n => (
              <button key={n} type="button" onClick={() => set("network", n)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", form.network === n ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {n.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Cor do Cartão</label>
          <div className="flex gap-2 flex-wrap">
            {GRADIENT_PRESETS.map(p => (
              <button key={p.value} type="button" onClick={() => setForm(prev => ({ ...prev, gradient: p.value, color: p.color }))}
                className={cn("flex flex-col items-center gap-1", form.gradient === p.value ? "opacity-100" : "opacity-60 hover:opacity-80")}>
                <div className={cn("h-8 w-14 rounded-lg bg-gradient-to-br", p.value, form.gradient === p.value && "ring-2 ring-slate-700 ring-offset-1")} />
                <span className="text-xs text-slate-500">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        {(createCard.error || updateCard.error) && <p className="text-xs text-red-600">{((createCard.error || updateCard.error) as Error).message}</p>}
        <Button className="w-full" disabled={createCard.isPending || updateCard.isPending}
          onClick={() => {
            const data = { ...form, limit: Number(form.limit), dueDay: Number(form.dueDay), closingDay: Number(form.closingDay) };
            if (editingCard) {
              updateCard.mutate(data);
            } else {
              createCard.mutate(data);
            }
          }}>
          {createCard.isPending || updateCard.isPending ? "Salvando..." : editingCard ? "Salvar Alterações" : "Criar Cartão"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── LaunchFormModal ──────────────────────────────────────────────────────────
function LaunchFormModal({
  open, onClose, cardId, currentMonth, currentYear,
}: {
  open: boolean; onClose: () => void; cardId: string; currentMonth: number; currentYear: number;
}) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: globalTags = [] } = useTags();
  const allTagSuggestions = Array.from(new Set([...globalTags, ...categories.flatMap((c: any) => c.tags ?? [])])) as string[];
  const [tab, setTab] = useState<"quick" | "manual">("quick");
  const [form, setForm] = useState({
    description: "", amount: "", date: new Date().toISOString().slice(0, 10),
    categoryId: "", tags: [] as string[], notes: "",
    launchType: "single" as "single" | "installment" | "fixed",
    totalInstallments: "2", startInstallment: "1",
    invoiceMonth: currentMonth, invoiceYear: currentYear,
    isPending: false,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const createTx = useMutation({
    mutationFn: (data: any) => apiFetch(`/api/credit-cards/${cardId}/transactions`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-transactions", cardId] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const payload: any = {
      description: form.description,
      amount: Number(form.amount),
      date: form.date,
      categoryId: form.categoryId || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      notes: form.notes || undefined,
      launchType: form.launchType,
      invoiceMonth: form.invoiceMonth,
      invoiceYear: form.invoiceYear,
      isPending: form.isPending,
    };
    if (form.launchType === "installment") {
      payload.totalInstallments = Number(form.totalInstallments);
      payload.startInstallment = Number(form.startInstallment);
    }
    createTx.mutate(payload);
  };

  // Preview for installments
  const installmentPreview: { installment: number; month: number; year: number }[] = [];
  if (form.launchType === "installment" && Number(form.totalInstallments) > 0) {
    const n = Number(form.totalInstallments);
    const start = Number(form.startInstallment) || 1;
    let m = form.invoiceMonth;
    let y = form.invoiceYear;
    for (let i = 1; i < start; i++) {
      m++; if (m > 12) { m = 1; y++; }
    }
    for (let i = start; i <= n; i++) {
      installmentPreview.push({ installment: i, month: m, year: y });
      m++; if (m > 12) { m = 1; y++; }
    }
  }

  // Next 6 months for invoice selector
  const nextMonths: { month: number; year: number; label: string }[] = [];
  {
    let m = currentMonth; let y = currentYear;
    for (let i = 0; i < 6; i++) {
      nextMonths.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]}/${y}` });
      m++; if (m > 12) { m = 1; y++; }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Lançamento" size="xl">
      {/* Tab selector */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-5">
        {(["quick", "manual"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {t === "quick" ? "Rápido" : "Manual"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
          <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Ex: Supermercado Extra" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
          <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
            <option value="">Sem categoria</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tags</label>
          <TagInput value={form.tags} onChange={v => set("tags", v)} suggestions={allTagSuggestions} />
        </div>

        {/* Launch type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de Lançamento *</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "single", label: "1x", sub: "Único" },
              { value: "installment", label: "Parcelado", sub: "Em parcelas" },
              { value: "fixed", label: "Fixo", sub: "Recorrente" },
            ] as const).map(opt => (
              <button key={opt.value} type="button" onClick={() => set("launchType", opt.value)}
                className={cn("flex flex-col items-center rounded-xl border-2 py-3 px-2 text-sm transition-colors",
                  form.launchType === opt.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <span className="font-bold">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Installment count */}
        {form.launchType === "installment" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total de parcelas</label>
              <input type="number" min={2} value={form.totalInstallments} onChange={e => set("totalInstallments", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            {tab === "manual" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Começa na parcela</label>
                <input type="number" min={1} value={form.startInstallment} onChange={e => set("startInstallment", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
            )}
          </div>
        )}

        {/* Manual: invoice month selector */}
        {tab === "manual" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entrar na fatura de</label>
            <select
              value={`${form.invoiceMonth}-${form.invoiceYear}`}
              onChange={e => {
                const [m, y] = e.target.value.split("-").map(Number);
                setForm(p => ({ ...p, invoiceMonth: m, invoiceYear: y }));
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {nextMonths.map(nm => (
                <option key={`${nm.month}-${nm.year}`} value={`${nm.month}-${nm.year}`}>{nm.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Installment preview */}
        {form.launchType === "installment" && installmentPreview.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 max-h-36 overflow-y-auto">
            <p className="text-xs font-medium text-slate-600 mb-2">Prévia das parcelas:</p>
            <div className="space-y-1">
              {installmentPreview.map(p => (
                <p key={p.installment} className="text-xs text-slate-500">
                  Parcela {p.installment}/{form.totalInstallments} → Fatura {MONTH_NAMES[p.month - 1]}/{p.year}
                  {form.amount ? ` · ${fmt(Number(form.amount) / Number(form.totalInstallments))}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Opcional..." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" />
        </div>

        {/* Pending toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPending} onChange={e => set("isPending", e.target.checked)} className="rounded" />
          <span className="text-sm text-slate-600">Marcar como pendente</span>
        </label>

        {createTx.error && <p className="text-xs text-red-600">{(createTx.error as Error).message}</p>}

        <Button className="w-full" disabled={createTx.isPending} onClick={handleSubmit}>
          {createTx.isPending ? "Salvando..." : "Registrar Lançamento"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreditCardsPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "invoices" | "analytics">("transactions");
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories = [] } = useCategories();
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["credit-cards"],
    queryFn: () => apiFetch<any[]>("/api/credit-cards"),
  });

  // Auto-select first card
  const effectiveCardId = selectedCardId ?? (cards.length > 0 ? cards[0].id : null);
  const card = cards.find((c: any) => c.id === effectiveCardId);

  const { data: transactions = [] } = useQuery({
    queryKey: ["card-transactions", effectiveCardId, month, year],
    queryFn: () => effectiveCardId
      ? apiFetch<any[]>(`/api/credit-cards/${effectiveCardId}/transactions?month=${month}&year=${year}`)
      : Promise.resolve([]),
    enabled: !!effectiveCardId,
  });

  const deleteTx = useMutation({
    mutationFn: (txId: string) => apiFetch(`/api/credit-cards/${effectiveCardId}/transactions/${txId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-transactions", effectiveCardId] }),
  });

  const navigateMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const filtered = transactions.filter((t: any) =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invoiceTotal = transactions.reduce((s: number, t: any) => s + Number(t.amount), 0);

  // Summary totals
  const totalLimit = cards.reduce((s: number, c: any) => s + Number(c.limit), 0);
  const totalUsed = cards.reduce((s: number, c: any) => s + Number(c.usedAmount), 0);
  const totalAvailable = totalLimit - totalUsed;

  // Due date info for selected card
  let daysUntilDue = 0;
  let daysUntilClosing = 0;
  let dueDate = new Date();
  if (card) {
    dueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
    daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    const closingDate = new Date(today.getFullYear(), today.getMonth(), card.closingDay);
    if (closingDate < today) closingDate.setMonth(closingDate.getMonth() + 1);
    daysUntilClosing = Math.ceil((closingDate.getTime() - today.getTime()) / 86400000);
  }

  // Analytics
  const byCategory = transactions.reduce<Record<string, number>>((acc: Record<string, number>, tx: any) => {
    const cat = categories.find((c: any) => c.id === tx.categoryId);
    const name = cat?.name ?? "Outros";
    acc[name] = (acc[name] ?? 0) + Number(tx.amount);
    return acc;
  }, {});
  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value: parseFloat((value as number).toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cartões de Crédito</h1>
          <p className="text-sm text-slate-500">
            {cards.length} {cards.length === 1 ? "cartão" : "cartões"} · {fmt(totalAvailable)} disponível
          </p>
        </div>
        <Button onClick={() => {
          setEditingCard(null);
          setShowCardModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum cartão cadastrado</h3>
          <p className="text-sm text-slate-400 mb-6">Adicione seu primeiro cartão para começar a gerenciar suas faturas.</p>
          <Button onClick={() => setShowCardModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>
      )}

      {cards.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Limite Total", value: fmt(totalLimit), icon: CreditCard, color: "blue" },
              { label: "Total Utilizado", value: fmt(totalUsed), icon: ArrowUpRight, color: "red" },
              { label: "Disponível", value: fmt(totalAvailable), icon: CheckCircle2, color: "emerald" },
              { label: "% do Limite", value: totalLimit > 0 ? `${((totalUsed / totalLimit) * 100).toFixed(1)}%` : "0%", icon: BarChart3, color: "violet" },
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
            {/* Left – cards + info */}
            <div className="xl:col-span-1 space-y-4">
              <div className="space-y-3">
                {cards.map((c: any) => (
                  <CardVisual
                    key={c.id}
                    card={c}
                    selected={c.id === effectiveCardId}
                    onClick={() => setSelectedCardId(c.id)}
                    onEdit={(e) => {
                      e.stopPropagation();
                      setEditingCard(c);
                      setShowCardModal(true);
                    }}
                  />
                ))}
              </div>

              {card && (
                <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700">Informações do Cartão</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[
                      { label: "Vencimento", value: `Dia ${card.dueDay}`, sub: daysUntilDue <= 5 ? `⚠ Vence em ${daysUntilDue} dias` : `Em ${daysUntilDue} dias`, icon: Calendar, alert: daysUntilDue <= 5 },
                      { label: "Fechamento", value: `Dia ${card.closingDay}`, sub: `Fecha em ${daysUntilClosing} dias`, icon: Lock, alert: false },
                      { label: "Fatura Atual", value: fmt(invoiceTotal), sub: "Em aberto", icon: CreditCard, alert: false },
                      { label: "Limite Disponível", value: fmt(Number(card.limit) - Number(card.usedAmount)), sub: `${Number(card.limit) > 0 ? (((Number(card.limit) - Number(card.usedAmount)) / Number(card.limit)) * 100).toFixed(0) : 0}% do limite`, icon: CheckCircle2, alert: false },
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
              )}
            </div>

            {/* Right – tabs */}
            <div className="xl:col-span-2 space-y-4">
              {/* Tabs header */}
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {(["transactions", "invoices", "analytics"] as const).map(t => {
                  const labels = { transactions: "Transações", invoices: "Faturas", analytics: "Análise" };
                  return (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Month nav (shown in transactions & analytics) */}
              {(activeTab === "transactions" || activeTab === "analytics") && (
                <div className="flex items-center justify-between rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-2.5">
                  <button onClick={() => navigateMonth(-1)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{MONTH_NAMES[month - 1]} {year}</span>
                  <button onClick={() => navigateMonth(1)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              )}

              {/* Transactions tab */}
              {activeTab === "transactions" && (
                <div className="rounded-xl bg-white shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-800">Fatura {MONTH_NAMES[month - 1]} {year}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{transactions.length} transações · {fmt(invoiceTotal)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700">
                        <AlertCircle className="h-3 w-3" />Em aberto
                      </span>
                      <Button size="sm" onClick={() => setShowLaunchModal(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Novo Lançamento
                      </Button>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-b border-slate-50">
                    <input type="text" placeholder="Buscar transação..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>

                  <div className="divide-y divide-slate-50 px-2 py-2 max-h-[480px] overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">Nenhuma transação encontrada</p>
                    ) : (
                      filtered.map((tx: any) => (
                        <TxRow key={tx.id} tx={tx} categories={categories} onDelete={id => deleteTx.mutate(id)} />
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                    <div className="text-sm text-slate-500">
                      <span className="font-medium text-amber-600">{transactions.filter((t: any) => t.isPending).length} pendentes</span>
                      {" · "}
                      <span>{transactions.filter((t: any) => !t.isPending).length} confirmadas</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total da fatura</p>
                      <p className="text-lg font-bold text-red-600">{fmt(invoiceTotal)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices tab */}
              {activeTab === "invoices" && card && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-700">Fatura Atual</p>
                        <p className="text-2xl font-bold text-amber-800">{fmt(invoiceTotal)}</p>
                        <p className="text-sm text-amber-600 mt-1">
                          Vence em {daysUntilDue} dias · dia {card.dueDay}/{(dueDate.getMonth() + 1).toString().padStart(2, "0")}
                        </p>
                      </div>
                      <Button className="bg-amber-600 hover:bg-amber-700">Pagar Fatura</Button>
                    </div>
                    <div className="mt-4 h-1.5 w-full rounded-full bg-amber-200">
                      <div className="h-1.5 rounded-full bg-amber-500"
                        style={{ width: `${Math.min((Number(card.usedAmount) / Number(card.limit)) * 100, 100)}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-amber-600">
                      <span>{Number(card.limit) > 0 ? ((Number(card.usedAmount) / Number(card.limit)) * 100).toFixed(1) : 0}% do limite usado</span>
                      <span>{fmt(Number(card.limit) - Number(card.usedAmount))} disponível</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-8 text-center">
                    <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Histórico de faturas pagas aparecerá aqui.</p>
                  </div>
                </div>
              )}

              {/* Analytics tab */}
              {activeTab === "analytics" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-5">
                    <h3 className="font-semibold text-slate-800 mb-1">Gastos por Categoria</h3>
                    <p className="text-xs text-slate-400 mb-4">{MONTH_NAMES[month - 1]} {year}</p>
                    {chartData.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} layout="vertical" barSize={18}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                          <Tooltip formatter={(v) => [fmt(Number(v)), "Gasto"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                          <Bar dataKey="value" fill={card?.color ?? "#820AD1"} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {chartData.length > 0 && (
                    <div className="rounded-xl bg-white shadow-sm border border-slate-100">
                      <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Detalhamento por Categoria</h3>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {chartData.map(({ name, value }) => {
                          const cat = categories.find((c: any) => c.name === name);
                          const color = cat?.color ?? "#64748B";
                          const pct = invoiceTotal > 0 ? ((value / invoiceTotal) * 100).toFixed(1) : "0";
                          return (
                            <div key={name} className="flex items-center gap-4 px-5 py-3.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
                                <HelpCircle className="h-4 w-4" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-slate-700">{name}</p>
                                  <p className="text-sm font-semibold text-slate-800">{fmt(value)}</p>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100">
                                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                </div>
                              </div>
                              <p className="shrink-0 text-xs text-slate-400 w-10 text-right">{pct}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Maior gasto", value: transactions.length > 0 ? fmt(Math.max(...transactions.map((t: any) => Number(t.amount)))) : fmt(0), sub: transactions.sort((a: any, b: any) => Number(b.amount) - Number(a.amount))[0]?.description ?? "-" },
                      { label: "Ticket médio", value: fmt(transactions.length ? invoiceTotal / transactions.length : 0), sub: `${transactions.length} transações` },
                      { label: "Parcelamentos", value: fmt(transactions.filter((t: any) => t.launchType === "installment").reduce((s: number, t: any) => s + Number(t.amount), 0)), sub: `${transactions.filter((t: any) => t.launchType === "installment").length} parcelas` },
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
        </>
      )}

      {/* Modals */}
      <CardFormModal 
        open={showCardModal} 
        onClose={() => {
          setShowCardModal(false);
          setEditingCard(null);
        }} 
        onSaved={() => {}} 
        editingCard={editingCard}
      />
      {effectiveCardId && (
        <LaunchFormModal
          open={showLaunchModal}
          onClose={() => setShowLaunchModal(false)}
          cardId={effectiveCardId}
          currentMonth={month}
          currentYear={year}
        />
      )}
    </div>
  );
}
