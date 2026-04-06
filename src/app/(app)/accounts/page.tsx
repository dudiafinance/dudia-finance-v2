"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Wallet, CreditCard, Building, PiggyBank, TrendingUp, Eye, EyeOff } from "lucide-react";
import { mockAccounts } from "@/lib/mock-data";
import { Account } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow, FormDivider } from "@/components/ui/form-field";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente", icon: Wallet },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard },
  { value: "investment", label: "Investimento", icon: TrendingUp },
];

function getIcon(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.icon ?? Wallet;
}

type FormData = {
  name: string;
  type: string;
  bank: string;
  agency: string;
  number: string;
  balance: string;
  color: string;
  currency: string;
  includeInTotal: boolean;
};

const emptyForm = (): FormData => ({
  name: "",
  type: "checking",
  bank: "",
  agency: "",
  number: "",
  balance: "0",
  color: "#10B981",
  currency: "BRL",
  includeInTotal: true,
});

export default function AccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBalances, setShowBalances] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (key: keyof FormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      type: a.type,
      bank: a.bank ?? "",
      agency: a.agency ?? "",
      number: a.number ?? "",
      balance: String(a.balance),
      color: a.color,
      currency: a.currency,
      includeInTotal: a.includeInTotal,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const now = new Date();
    if (editingId) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                name: form.name,
                type: form.type as any,
                bank: form.bank || undefined,
                agency: form.agency || undefined,
                number: form.number || undefined,
                balance: Number(form.balance),
                color: form.color,
                currency: form.currency,
                includeInTotal: form.includeInTotal,
                updatedAt: now,
              }
            : a
        )
      );
      toast("Conta atualizada!");
    } else {
      setAccounts((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          userId: "1",
          name: form.name,
          type: form.type as any,
          bank: form.bank || undefined,
          agency: form.agency || undefined,
          number: form.number || undefined,
          balance: Number(form.balance),
          color: form.color,
          currency: form.currency,
          includeInTotal: form.includeInTotal,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      toast("Conta criada!");
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setAccounts((prev) => prev.filter((a) => a.id !== deleteId));
    setDeleteId(null);
    toast("Conta excluída.", "warning");
  };

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.bank ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts.filter((a) => a.includeInTotal && a.type !== "credit_card")
    .reduce((s, a) => s + a.balance, 0);
  const totalCredit = accounts.filter((a) => a.type === "credit_card")
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  const groupedByType = ACCOUNT_TYPES.map((t) => ({
    ...t,
    items: filtered.filter((a) => a.type === t.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contas</h1>
          <p className="text-sm text-slate-500">{accounts.length} contas cadastradas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showBalances ? "Ocultar" : "Mostrar"}
          </button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Saldo Total", value: totalBalance, sub: "contas inclusas" },
          { label: "Contas Ativas", value: accounts.filter((a) => a.isActive).length, isCurrency: false, sub: `de ${accounts.length} total` },
          { label: "Fatura Cartões", value: totalCredit, sub: "em aberto" },
        ].map(({ label, value, sub, isCurrency = true }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={cn("text-xl font-bold mt-1", typeof value === "number" && value < 0 ? "text-red-600" : "text-slate-900")}>
              {showBalances ? (isCurrency ? fmt(value as number) : value) : "••••••"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar contas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {groupedByType.map(({ value: type, label, icon: Icon, items }) => (
        <section key={type}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            <Icon className="h-4 w-4" />
            {label} ({items.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const AccIcon = getIcon(a.type);
              return (
                <div key={a.id} className="group rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${a.color}18` }}>
                        <AccIcon className="h-6 w-6" style={{ color: a.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{a.name}</p>
                        <p className="text-sm text-slate-400">{a.bank ?? ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}</p>
                        {a.number && (
                          <p className="text-xs text-slate-300 font-mono">•••• {a.number.slice(-4)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(a.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        {a.type === "credit_card" ? "Fatura atual" : "Saldo"}
                      </p>
                      {!a.includeInTotal && (
                        <span className="text-xs text-slate-300">Não incluso no total</span>
                      )}
                    </div>
                    <p className={cn("text-xl font-bold mt-0.5",
                      a.balance < 0 ? "text-red-600" : "text-slate-900"
                    )}>
                      {showBalances ? fmt(a.balance) : "••••••"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Conta" : "Nova Conta"}
        description="Configure os dados da conta" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Conta *</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => set("type", value)}
                  className={cn("flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                    form.type === value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FormRow>
            <Field label="Nome da Conta" required error={errors.name}>
              <Input placeholder="Ex: Nubank, Itaú Corrente..." value={form.name}
                onChange={(e) => set("name", e.target.value)} error={!!errors.name} />
            </Field>
            <Field label="Banco / Instituição">
              <Input placeholder="Ex: Nubank, Itaú..." value={form.bank}
                onChange={(e) => set("bank", e.target.value)} />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Saldo Inicial">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" placeholder="0,00"
                  value={form.balance} onChange={(e) => set("balance", e.target.value)} className="pl-9" />
              </div>
            </Field>
            <Field label="Moeda">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="BRL">BRL — Real</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </Select>
            </Field>
          </FormRow>

          {(form.type === "checking" || form.type === "savings") && (
            <FormRow>
              <Field label="Agência">
                <Input placeholder="0000" value={form.agency} onChange={(e) => set("agency", e.target.value)} />
              </Field>
              <Field label="Número da Conta">
                <Input placeholder="00000-0" value={form.number} onChange={(e) => set("number", e.target.value)} />
              </Field>
            </FormRow>
          )}

          <FormDivider label="Aparência" />

          <Field label="Cor">
            <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
          </Field>

          <FormDivider label="Configurações" />

          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={form.includeInTotal} onChange={(e) => set("includeInTotal", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
            <div>
              <span className="text-sm font-medium text-slate-700">Incluir no saldo total</span>
              <p className="text-xs text-slate-400">Esta conta será somada no saldo geral do dashboard</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Salvar Alterações" : "Criar Conta"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Conta" size="sm">
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir esta conta? As transações vinculadas serão mantidas.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
