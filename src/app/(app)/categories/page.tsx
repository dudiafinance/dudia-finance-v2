"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Tag, Sparkles, Loader2 } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useTags, useUpdateTags } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, FormRow } from "@/components/ui/form-field";
import { TagInput } from "@/components/ui/tag-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  color: "#10B981",
  icon: "more-horizontal",
  budgetAmount: "",
  budgetPeriod: "monthly",
  tags: [],
});

export default function CategoriesPage() {
  const { toast } = useToast();
  const { data: categories = [], isLoading, refetch } = useCategories();
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

  // Tags management
  const [tagInput, setTagInput] = useState("");
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // All tags = global tags + tags extracted from categories (deduplicated)
  const extractedTags = Array.from(new Set([...globalTags, ...categories.flatMap((c: any) => c.tags ?? [])]));

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
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
      budgetPeriod: form.budgetPeriod || undefined,
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

  const addTag = async () => {
    const newTag = tagInput.trim().toLowerCase();
    if (!newTag) return;
    if (globalTags.includes(newTag)) { setTagInput(""); return; }
    try {
      await updateTags.mutateAsync([...globalTags, newTag]);
      setTagInput("");
      toast("Tag adicionada!");
    } catch {
      toast("Erro ao salvar tag", "error");
    }
  };

  const removeTag = async (tag: string) => {
    try {
      await updateTags.mutateAsync(globalTags.filter((t) => t !== tag));
      toast("Tag removida.", "warning");
    } catch {
      toast("Erro ao remover tag", "error");
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
          <p className="text-sm text-slate-500">{categories.length} categorias · {incomeCount} receitas · {expenseCount} despesas</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="outline" onClick={seedCategories} disabled={seeding}>
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {seeding ? "Criando..." : "Gerar Categorias Padrão"}
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: "all", label: "Todas" },
            { key: "income", label: "Receitas" },
            { key: "expense", label: "Despesas" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterType(key)}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                filterType === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tags</h2>
          <Button variant="outline" size="sm" onClick={() => setTagModalOpen(true)}>
            <Tag className="mr-2 h-3 w-3" />
            Gerenciar Tags
          </Button>
        </div>
        {extractedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {extractedTags.map((tag) => (
              <span key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nenhuma tag criada ainda</p>
        )}
      </div>

      {/* Income section */}
      {(filterType === "all" || filterType === "income") && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-600 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Receitas ({filtered.filter((c: any) => c.type === "income").length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.filter((c: any) => c.type === "income").map((c: any) => (
              <CategoryCard key={c.id} category={c} onEdit={openEdit} onDelete={setDeleteId} />
            ))}
          </div>
        </section>
      )}

      {/* Expense section */}
      {(filterType === "all" || filterType === "expense") && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            Despesas ({filtered.filter((c: any) => c.type === "expense").length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.filter((c: any) => c.type === "expense").map((c: any) => (
              <CategoryCard key={c.id} category={c} onEdit={openEdit} onDelete={setDeleteId} />
            ))}
          </div>
        </section>
      )}

      {/* Category Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Categoria" : "Nova Categoria"}
        description="Configure a categoria" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo *</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "income", label: "Receita" },
                { key: "expense", label: "Despesa" },
              ] as const).map(({ key, label }) => (
                <button key={key} type="button" onClick={() => set("type", key)}
                  className={cn("rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                    form.type === key
                      ? key === "income" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FormRow>
            <Field label="Nome" required error={errors.name}>
              <Input placeholder="Ex: Alimentação, Salário..." value={form.name}
                onChange={(e) => set("name", e.target.value)} error={!!errors.name} />
            </Field>
            <Field label="Ícone">
              <Select value={form.icon} onChange={(e) => set("icon", e.target.value)}>
                {ICONS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <Field label="Cor">
            <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
          </Field>

          <Field label="Tags (para esta categoria)">
            <TagInput value={form.tags} onChange={(tags) => set("tags", tags)}
              placeholder="Ex: fixo, variável... (Enter para adicionar)" />
            <p className="text-xs text-slate-400 mt-1">Tags específicas desta categoria</p>
          </Field>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Orçamento (opcional)</p>
            <FormRow>
              <Field label="Valor limite">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                  <Input type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.budgetAmount} onChange={(e) => set("budgetAmount", e.target.value)} className="pl-9" />
                </div>
              </Field>
              <Field label="Período">
                <Select value={form.budgetPeriod} onChange={(e) => set("budgetPeriod", e.target.value)}>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </Select>
              </Field>
            </FormRow>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Preview</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${form.color}20` }}>
                <span className="text-lg font-bold" style={{ color: form.color }}>
                  {form.name.charAt(0) || "C"}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-800">{form.name || "Nome da categoria"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-xs font-medium", form.type === "income" ? "text-emerald-600" : "text-red-600")}>
                    {form.type === "income" ? "Receita" : "Despesa"}
                  </span>
                  {form.tags.map((tag) => (
                    <span key={tag} className="text-xs text-slate-400">#{tag}</span>
                  ))}
                </div>
              </div>
              {form.color && (
                <div className="ml-auto h-4 w-4 rounded-full" style={{ backgroundColor: form.color }} />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Salvar Alterações" : "Criar Categoria"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Categoria" size="sm">
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir esta categoria?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
        </div>
      </Modal>

      {/* Tags Management Modal */}
      <Modal open={tagModalOpen} onClose={() => setTagModalOpen(false)} title="Gerenciar Tags" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Tags globais disponíveis para uso em transações e lançamentos.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Nova tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1"
            />
            <Button onClick={addTag} disabled={updateTags.isPending}>Adicionar</Button>
          </div>

          {globalTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {globalTags.map((tag: string) => (
                <div key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1">
                  <Tag className="h-3 w-3 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              Nenhuma tag criada ainda. Adicione tags acima para usá-las nas transações.
            </p>
          )}

          {categories.some((c: any) => (c.tags ?? []).length > 0) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 mb-2">Tags das categorias</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(categories.flatMap((c: any) => c.tags ?? []))).map((tag: any) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setTagModalOpen(false)}>Fechar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: any;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
}) {
  const budgetAmount = category.budgetAmount ? Number(category.budgetAmount) : undefined;
  return (
    <div className="group relative rounded-xl bg-white p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${category.color}20` }}>
            <span className="text-base font-bold" style={{ color: category.color }}>
              {category.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{category.name}</p>
            {budgetAmount && (
              <p className="text-xs text-slate-400">
                Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(budgetAmount)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(category)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(category.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(category.tags ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {(category.tags ?? []).map((tag: string) => (
            <span key={tag}
              className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 h-0.5 w-full rounded-full" style={{ backgroundColor: `${category.color}30` }}>
        <div className="h-0.5 rounded-full w-full" style={{ backgroundColor: category.color }} />
      </div>
    </div>
  );
}