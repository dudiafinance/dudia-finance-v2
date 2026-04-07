"use client";

import { useState, useMemo } from "react";
import { 
  Plus, Search, Edit, Trash2, Tag, Sparkles, Loader2, 
  Coffee, Car, Home, Heart, Film, Book, Briefcase, Laptop, 
  TrendingUp, ShoppingBag, Zap, Phone, MoreHorizontal, 
  ChevronLeft, ChevronRight, Calculator, PieChart, Layers,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory, 
  useTags, 
  useUpdateTags,
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

const ICON_MAP: Record<string, any> = {
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
  const { data: globalTags = [] } = useTags();
  const updateTags = useUpdateTags();

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

  const openEdit = (c: any) => {
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
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar", "error");
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

  const filtered = categories.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tags ?? []).some((t: string) => t.includes(searchTerm.toLowerCase()));
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchType;
  });

  const incomeCount = categories.filter((c: any) => c.type === "income").length;
  const expenseCount = categories.filter((c: any) => c.type === "expense").length;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-10 w-10 border-4 border-slate-200 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-32">
      {/* ── Background Aura ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[140px] bg-emerald-500/20"
        />
        <motion.div 
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 15, repeat: Infinity, delay: 3, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-indigo-500/20"
        />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto pt-8 px-4 sm:px-8 space-y-8">
        
        {/* ── Header ────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Layers className="h-7 w-7 text-emerald-500" />
              </div>
              Categorias
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 ml-1">Organização Premium</p>
          </div>

          <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-2 rounded-[32px] border border-white shadow-xl">
             <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div className="min-w-[140px] text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{currentYear}</p>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{MONTH_NAMES[currentMonth-1]}</p>
                </div>
                <button onClick={nextMonth} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors">
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
             </div>
             
             <div className="h-8 w-[1px] bg-slate-200 mx-1" />

             <Button onClick={openCreate} className="h-12 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-none shadow-sm font-bold text-xs uppercase tracking-widest px-6 ml-1">
                <Plus className="mr-2 h-4 w-4" /> Novo
             </Button>
          </div>
        </header>

        {/* ── Search & Stats ────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-16 w-full glass-card rounded-[32px] pl-14 pr-6 text-base font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl transition-all"
            />
          </div>

          <div className="flex gap-2 glass-card p-2 rounded-[32px] lg:col-span-2 shadow-2xl">
            {[
              { key: "all", label: "Todas", color: "text-slate-600" },
              { key: "income", label: "Receitas", color: "text-emerald-600" },
              { key: "expense", label: "Despesas", color: "text-red-600" },
            ].map(({ key, label, color }) => (
              <button 
                key={key} 
                onClick={() => setFilterType(key)}
                className={cn(
                  "flex-1 rounded-[24px] py-1 text-xs font-black uppercase tracking-widest transition-all duration-300",
                  filterType === key ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {categories.length === 0 && !searchTerm && (
           <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
           >
              <div className="h-24 w-24 bg-white rounded-[40px] flex items-center justify-center shadow-xl mb-6">
                <Sparkles className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Bem vindo à sua Carteira</h2>
              <p className="text-slate-400 max-w-sm mb-8">Poupe tempo configurando as categorias padrão recomendadas pela DUDIA.</p>
              <Button onClick={seedCategories} disabled={seeding} className="h-14 px-10 rounded-[28px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-emerald-500/20 shadow-2xl">
                {seeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5" />}
                {seeding ? "Gerando..." : "Gerar Categorias Padrão"}
              </Button>
           </motion.div>
        )}

        {/* ── Main List ─────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={filterType + searchTerm}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Receitas */}
            {(filterType === "all" || filterType === "income") && filtered.some(c => c.type === "income") && (
              <section className="px-2">
                <div className="flex items-center gap-4 mb-6 px-4">
                  <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Receitas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.filter((c: any) => c.type === "income").map((c: any) => (
                    <CategoryCard key={c.id} category={c} spent={stats[c.id] || 0} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </div>
              </section>
            )}

            {/* Despesas */}
            {(filterType === "all" || filterType === "expense") && filtered.some(c => c.type === "expense") && (
              <section className="px-2">
                <div className="flex items-center gap-4 mb-6 px-4">
                  <div className="h-1 w-12 bg-red-500 rounded-full" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Despesas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.filter((c: any) => c.type === "expense").map((c: any) => (
                    <CategoryCard key={c.id} category={c} spent={stats[c.id] || 0} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>

        {/* --- MODAIS --- */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingId ? "Configurar Categoria" : "Nova Categoria"}
          size="lg">
          <div className="space-y-6 pt-2">
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              {(["income", "expense"] as const).map((t) => (
                <button key={t} onClick={() => set("type", t)}
                  className={cn(
                    "h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-2",
                    form.type === t 
                      ? (t === "income" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700")
                      : "border-slate-100 bg-slate-50 text-slate-400"
                  )}
                >
                  {t === "income" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>

            <FormRow>
              <Field label="Nome" required error={errors.name}>
                <Input placeholder="Alimentação, Moradia..." value={form.name} onChange={e => set("name", e.target.value)} />
              </Field>
              <Field label="Ícone">
                <Select value={form.icon} onChange={e => set("icon", e.target.value)}>
                  {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </Select>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Definir Orçamento (Opcional)">
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <Input type="number" step="0.01" className="pl-9" placeholder="0,00" value={form.budgetAmount} onChange={e => set("budgetAmount", e.target.value)} />
                 </div>
              </Field>
              <Field label="Frequência">
                <Select value={form.budgetPeriod} onChange={e => set("budgetPeriod", e.target.value)}>
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                </Select>
              </Field>
            </FormRow>

            <Field label="Identidade Visual">
              <ColorPicker value={form.color} onChange={c => set("color", c)} />
            </Field>

            <Field label="Tags">
              <TagInput value={form.tags} onChange={tags => set("tags", tags)} placeholder="Auto-completar..." />
            </Field>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
               <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-2xl h-12 px-6">Cancelar</Button>
               <Button onClick={save} className="rounded-2xl h-12 px-10 bg-slate-900 border-none">
                 {editingId ? "Salvar Alterações" : "Ativar Categoria"}
               </Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Categoria" size="sm">
          <div className="text-center py-4">
             <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8" />
             </div>
             <p className="text-slate-600 font-bold mb-2">Confirmar Exclusão?</p>
             <p className="text-slate-400 text-xs px-4">Todas as transações vinculadas a esta categoria ficarão sem classificação.</p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 rounded-2xl h-12">Manter</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 rounded-2xl h-12">Excluir</Button>
          </div>
        </Modal>

      </div>
    </div>
  );
}

function CategoryCard({ category, spent, onEdit, onDelete }: { category: any, spent: number, onEdit: (c: any) => void, onDelete: (id: string) => void }) {
  const Icon = ICON_MAP[category.icon ?? "more-horizontal"] || MoreHorizontal;
  const budget = category.budgetAmount ? Number(category.budgetAmount) : 0;
  
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = progress > 100;
  const isWarning = progress > 80 && !isOver;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative glass-card rounded-[40px] p-6 shadow-xl border border-white hover:bg-white transition-all cursor-pointer overflow-hidden"
    >
      {/* ProgressBar Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
         <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div 
            className="h-14 w-14 rounded-[22px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Icon className="h-7 w-7" style={{ color: category.color }} />
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onEdit(category)} className="h-9 w-9 glass-card rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(category.id)} className="h-9 w-9 glass-card rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{category.name}</h3>
          {category.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {category.tags.slice(0, 2).map((t: string) => (
                <span key={t} className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">#{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Utilizado</p>
              <p className={cn("text-base font-black transition-colors", isOver ? "text-red-500" : "text-slate-900")}>
                {fmt(spent)}
              </p>
            </div>
            {budget > 0 && (
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Limite</p>
                  <p className="text-xs font-black text-slate-400">{fmt(budget)}</p>
               </div>
            )}
          </div>

          {budget > 0 && (
            <div className="space-y-2">
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {progress.toFixed(0)}% do orçamento
                  </p>
                  {isOver && <AlertCircle className="h-3 w-3 text-red-500" />}
               </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}