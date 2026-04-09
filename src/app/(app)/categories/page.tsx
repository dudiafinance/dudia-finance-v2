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
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
      budgetPeriod: form.budgetAmount ? form.budgetPeriod : undefined,
      tags: form.tags,
    };
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, ...formPayload } as any);
        toast("Categoria atualizada!");
      } else {
        await createCategory.mutateAsync(formPayload as any);
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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando arquitetura...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Classificação de Fluxo</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Categorias</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border p-1 shadow-precision">
              <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-4 text-center">
                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-none">{MONTH_NAMES[currentMonth-1]}</p>
                <p className="text-[9px] font-bold text-muted-foreground tabular-nums">{currentYear}</p>
              </div>
              <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <Button onClick={openCreate} className="h-9 px-6 text-[11px] font-bold uppercase shadow-precision">
              <Plus className="mr-2 h-3.5 w-3.5" /> Nova Categoria
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
          <div className="relative group flex-1 w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              placeholder="Buscar por nome ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-[13px] bg-secondary/30 border-border focus:bg-background shadow-precision"
            />
          </div>

          <div className="flex gap-1 bg-secondary p-1 rounded-lg border border-border shadow-precision">
            {[
              { key: "all", label: "Todas" },
              { key: "income", label: "Receitas" },
              { key: "expense", label: "Despesas" },
            ].map(({ key, label }) => (
              <Button 
                key={key} 
                variant={filterType === key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType(key)}
                className={cn(
                  "h-7 px-6 transition-all rounded text-[10px] font-bold uppercase tracking-wider",
                  filterType === key 
                    ? "bg-background text-foreground shadow-precision border-precision border-border/50" 
                    : "text-muted-foreground hover:text-foreground"
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
            className="space-y-12"
          >
            {(filterType === "all" || filterType === "income") && filtered.some(c => c.type === "income") && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Fontes de Receita</h2>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.filter((c) => c.type === "income").map((c) => (
                    <CategoryCard key={c.id} category={c} spent={stats[c.id] || 0} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </div>
              </section>
            )}

            {(filterType === "all" || filterType === "expense") && filtered.some(c => c.type === "expense") && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Centros de Custo</h2>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="space-y-8 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {(["income", "expense"] as const).map((t) => (
                <Button 
                  key={t} 
                  variant="ghost"
                  onClick={() => set("type", t)}
                  className={cn(
                    "h-12 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border shadow-precision",
                    form.type === t 
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/50"
                  )}
                >
                  {t === "income" ? "Receita" : "Despesa"}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-6">
                <Field label="Nome da Categoria" required error={errors.name}>
                  <Input placeholder="Ex: Alimentação" value={form.name} onChange={e => set("name", e.target.value)} 
                    className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all" />
                </Field>

                <Field label="Ícone Representativo">
                  <Select value={form.icon} onChange={e => set("icon", e.target.value)} 
                    className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                    {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </Select>
                </Field>
              </div>

              <div className="space-y-6">
                <Field label="Teto de Gasto (Budget)">
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                    <Input type="number" step="0.01" className="pl-6 h-10 text-sm font-bold border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-foreground tabular-nums" placeholder="0,00" value={form.budgetAmount} onChange={e => set("budgetAmount", e.target.value)} />
                  </div>
                </Field>

                <Field label="Período do Teto">
                  <Select value={form.budgetPeriod} onChange={e => set("budgetPeriod", e.target.value)} 
                    className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground">
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </Select>
                </Field>
              </div>
            </div>

            <Field label="Identidade Visual (Cor)">
              <ColorPicker value={form.color} onChange={c => set("color", c)} />
            </Field>

            <Field label="Tags de Filtragem">
              <TagInput value={form.tags} onChange={tags => set("tags", tags)} placeholder="Pressione Enter..." />
            </Field>

            <div className="flex gap-4 pt-6 border-t border-border/50">
              <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
              <Button onClick={save} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
                {editingId ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Categoria" size="sm">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Confirmar Exclusão?</h3>
                <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">As transações vinculadas a esta categoria ficarão órfãs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Excluir</Button>
            </div>
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-background rounded-lg border border-border/50 p-6 transition-all duration-300 shadow-precision cursor-pointer overflow-hidden"
      onClick={() => onEdit(category)}
    >
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div 
          className="h-10 w-10 rounded flex items-center justify-center border border-white/5 shadow-precision group-hover:scale-105 transition-transform"
          style={{ backgroundColor: category.color }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <Button 
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit(category); }} 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }} 
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <h3 className="text-sm font-bold text-foreground tracking-tight truncate">{category.name}</h3>
        {(category.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(category.tags ?? []).slice(0, 2).map((t: string) => (
              <span key={t} className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50 px-2 py-0.5 rounded">#{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-border/50 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Execução</p>
            <p className={cn("text-sm font-bold tabular-nums tracking-tight", isOver ? "text-red-500" : "text-foreground")}>
              {fmt(spent)}
            </p>
          </div>
          {budget > 0 && (
            <div className="text-right">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Teto</p>
              <p className="text-[11px] font-bold text-muted-foreground tabular-nums">{fmt(budget)}</p>
            </div>
          )}
        </div>

        {budget > 0 && (
          <div className="space-y-2">
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-foreground"
                )}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {progress.toFixed(1)}% CONSUMIDO
              </p>
              {isOver && <AlertCircle className="h-3 w-3 text-red-500" />}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop Accent */}
      <div className="absolute top-0 right-0 h-16 w-16 opacity-5 blur-3xl rounded-full -mr-8 -mt-8" style={{ backgroundColor: category.color }} />
    </motion.div>
  );
}