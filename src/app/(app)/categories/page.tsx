"use client";

import React, { useState } from "react";
import {
  Plus, Search, Edit, Trash2, Sparkles, Loader2,
  Coffee, Car, Home, Heart, Film, Book, Briefcase, Laptop,
  TrendingUp, ShoppingBag, Zap, Phone, MoreHorizontal,
  ChevronLeft, ChevronRight, Layers,
  AlertCircle
} from "lucide-react";
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory, 
  useCategoryStats 
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow } from "@/components/ui/form-field";
import { TagInput } from "@/components/ui/tag-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

type CategoryItem = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon?: string;
  budgetAmount?: number | string | null;
  budgetPeriod?: string;
  tags?: string[];
};

import type { LucideProps } from "lucide-react";
type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

const ICON_MAP: Record<string, IconComponent> = {
  coffee: Coffee,
  car: Car,
  home: Home,
  heart: Heart,
  film: Film,
  book: Book,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  phone: Phone,
  "more-horizontal": MoreHorizontal,
};

const ICONS = [
  { value: "coffee", label: "☕ Alimentação" },
  { value: "car", label: "🚗 Transporte" },
  { value: "home", label: "🏠 Moradia" },
  { value: "heart", label: "❤️ Saúde" },
  { value: "film", label: "🎬 Lazer" },
  { value: "book", label: "📚 Educação" },
  { value: "briefcase", label: "💼 Trabalho" },
  { value: "laptop", label: "💻 Tecnologia" },
  { value: "trending-up", label: "📈 Investimentos" },
  { value: "shopping-bag", label: "🛍️ Compras" },
  { value: "zap", label: "⚡ Energia" },
  { value: "phone", label: "📱 Telefone" },
  { value: "more-horizontal", label: "• Outros" },
];

type FormData = {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  budgetAmount: string;
  budgetPeriod: string;
  tags: string[];
};

const emptyForm = (): FormData => ({
  name: "",
  type: "expense",
  color: "#820AD1",
  icon: "more-horizontal",
  budgetAmount: "",
  budgetPeriod: "monthly",
  tags: [],
});

export default function CategoriesPage() {
  const { toast } = useToast();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const { data: categories = [], isLoading, refetch } = useCategories();
  const { data: stats = {} } = useCategoryStats(currentMonth, currentYear);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [seeding, setSeeding] = useState(false);

  // Month Navigation
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(v => v + 1); }
    else setCurrentMonth(v => v + 1);
  };
  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(v => v - 1); }
    else setCurrentMonth(v => v - 1);
  };

  const set = (key: keyof FormData, value: string | string[]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: CategoryItem) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon ?? "more-horizontal",
      budgetAmount: c.budgetAmount ? String(Number(c.budgetAmount)) : "",
      budgetPeriod: c.budgetPeriod ?? "monthly",
      tags: c.tags ?? [],
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

  const save = async () => {
    if (!validate()) return;
    const formPayload = {
      name: form.name,
      type: form.type,
      color: form.color,
      icon: form.icon,
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : null,
      budgetPeriod: form.budgetPeriod || "monthly",
      tags: form.tags,
    };
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, ...formPayload });
        toast("Categoria atualizada!");
      } else {
        await createCategory.mutateAsync(formPayload);
        toast("Categoria criada!");
      }
      setModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      toast("Categoria excluída.", "warning");
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const seedCategories = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/categories/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Erro ao criar categorias", "error");
        return;
      }
      toast(`${data.count} categorias criadas com sucesso!`);
      refetch();
    } catch {
      toast("Erro ao criar categorias", "error");
    } finally {
      setSeeding(false);
    }
  };

  const typedCategories = categories as unknown as CategoryItem[];

  const filtered = typedCategories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tags ?? []).some((t: string) => t.includes(searchTerm.toLowerCase()));
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              Categorias
            </h1>
            <p className="text-sm text-slate-500 mt-1">Organize suas categorias de receitas e despesas</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button onClick={prevMonth} className="h-9 w-9 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-600 transition-colors">
                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="min-w-[120px] text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{MONTH_NAMES[currentMonth-1]}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentYear}</p>
              </div>
              <button onClick={nextMonth} className="h-9 w-9 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-600 transition-colors">
                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            
            <Button onClick={openCreate} className="font-bold shadow-lg shadow-blue-500/20 px-6">
              <Plus className="mr-2 h-5 w-5" /> Nova
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Search & Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Buscar categorias ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12"
            />
          </div>

          <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl lg:col-span-2 border border-slate-200/50 dark:border-slate-700/50">
            {[
              { key: "all", label: "Todas" },
              { key: "income", label: "Receitas" },
              { key: "expense", label: "Despesas" },
            ].map(({ key, label }) => (
              <Button 
                key={key} 
                variant="ghost"
                onClick={() => setFilterType(key)}
                className={cn(
                  "flex-1 rounded-lg py-2 h-9 text-xs font-bold transition-all shadow-none",
                  filterType === key 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-transparent"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {categories.length === 0 && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Bem-vindo!</h2>
            <p className="text-slate-500 max-w-sm mb-6">Configure as categorias padrão para organizar suas transações.</p>
            <Button onClick={seedCategories} disabled={seeding} size="lg" className="font-bold shadow-xl shadow-blue-500/20 px-8">
              {seeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              {seeding ? "Gerando ecossistema..." : "Gerar Categorias Padrão"}
            </Button>
          </motion.div>
        )}

        {/* Categories List */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={filterType + searchTerm}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {(filterType === "all" || filterType === "income") && filtered.some(c => c.type === "income") && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Receitas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter((c) => c.type === "income").map((c) => (
                    <CategoryCard key={c.id} category={c} spent={stats[c.id] || 0} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </div>
              </section>
            )}

            {(filterType === "all" || filterType === "expense") && filtered.some(c => c.type === "expense") && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-8 bg-red-500 rounded-full" />
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Despesas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter((c) => c.type === "expense").map((c) => (
                    <CategoryCard key={c.id} category={c} spent={stats[c.id] || 0} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingId ? "Editar Categoria" : "Nova Categoria"}
          size="lg">
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              {(["income", "expense"] as const).map((t) => (
                <Button 
                  key={t} 
                  variant="ghost"
                  onClick={() => set("type", t)}
                  className={cn(
                    "h-14 rounded-xl font-bold text-sm transition-all border-2 shadow-none",
                    form.type === t 
                      ? (t === "income" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "border-red-500 bg-red-50/50 text-red-700 dark:bg-red-500/10 dark:text-red-400")
                      : "border-slate-100 bg-slate-50/50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                  )}
                >
                  {t === "income" ? "Receita" : "Despesa"}
                </Button>
              ))}
            </div>

            <FormRow>
              <Field label="Nome" required error={errors.name}>
                <Input placeholder="Alimentação, Moradia..." value={form.name} onChange={e => set("name", e.target.value)} className="rounded-md" />
              </Field>
              <Field label="Ícone">
                <Select value={form.icon} onChange={e => set("icon", e.target.value)} className="rounded-md">
                  {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </Select>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Orçamento (Opcional)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <Input type="number" step="0.01" className="pl-9 rounded-md" placeholder="0,00" value={form.budgetAmount} onChange={e => set("budgetAmount", e.target.value)} />
                </div>
              </Field>
              <Field label="Frequência">
                <Select value={form.budgetPeriod} onChange={e => set("budgetPeriod", e.target.value)} className="rounded-md">
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                </Select>
              </Field>
            </FormRow>

            <Field label="Cor">
              <ColorPicker value={form.color} onChange={c => set("color", c)} />
            </Field>

            <Field label="Tags">
              <TagInput value={form.tags} onChange={tags => set("tags", tags)} placeholder="Adicionar tags..." />
            </Field>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700 mt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="font-bold">Cancelar</Button>
              <Button onClick={save} className="font-bold shadow-lg px-8">
                {editingId ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Categoria" size="sm">
          <div className="text-center py-4">
            <div className="h-14 w-14 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Confirmar Exclusão?</p>
            <p className="text-sm text-slate-500">Transações ficarão sem categoria.</p>
          </div>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-bold">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 font-bold shadow-lg shadow-red-500/20">Excluir</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

function CategoryCard({ category, spent, onEdit, onDelete }: { category: CategoryItem, spent: number, onEdit: (c: CategoryItem) => void, onDelete: (id: string) => void }) {
  const Icon = ICON_MAP[category.icon ?? "more-horizontal"] || MoreHorizontal;
  const budget = category.budgetAmount ? Number(category.budgetAmount) : 0;
  
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = progress > 100;
  const isWarning = progress > 80 && !isOver;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="h-11 w-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: category.color }} />
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <Button 
            variant="secondary"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit(category); }} 
            className="h-8 w-8 bg-white/80 dark:bg-slate-700/80 text-slate-400 hover:text-blue-600 shadow-sm border-none"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="secondary"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }} 
            className="h-8 w-8 bg-white/80 dark:bg-slate-700/80 text-slate-400 hover:text-red-500 shadow-sm border-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white leading-tight truncate">{category.name}</h3>
        {(category.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(category.tags ?? []).slice(0, 2).map((t: string) => (
              <span key={t} className="text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">#{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Utilizado</p>
            <p className={cn("text-sm font-bold", isOver ? "text-red-500" : "text-slate-900 dark:text-white")}>
              {fmt(spent)}
            </p>
          </div>
          {budget > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Limite</p>
              <p className="text-xs font-semibold text-slate-400">{fmt(budget)}</p>
            </div>
          )}
        </div>

        {budget > 0 && (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isOver ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-500"
                )}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-medium text-slate-400">
                {progress.toFixed(0)}% do orçamento
              </p>
              {isOver && <AlertCircle className="h-3 w-3 text-red-500" />}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}