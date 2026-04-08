"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Tag, Loader2, Save } from "lucide-react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, FormRow } from "@/components/ui/form-field";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TagsPage() {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#820AD1" });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const set = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", color: "#820AD1" });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({ name: t.name, color: t.color || "#820AD1" });
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
    try {
      if (editingId) {
        await updateTag.mutateAsync({ id: editingId, ...form });
        toast("Etiqueta atualizada!");
      } else {
        await createTag.mutateAsync(form);
        toast("Etiqueta criada!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message ?? "Erro ao salvar etiqueta", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTag.mutateAsync(deleteId);
      toast("Etiqueta excluída.", "warning");
    } catch {
      toast("Erro ao excluir", "error");
    }
    setDeleteId(null);
  };

  const filtered = tags.filter((t: any) => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-10 w-10 border-4 border-slate-200 border-t-purple-600 rounded-full" />
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
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              Tags (Etiquetas)
            </h1>
            <p className="text-sm text-slate-500 mt-1">Classifique e encontre transações mais rápido listando suas etiquetas.</p>
          </div>

          <Button onClick={openCreate} className="font-bold shadow-lg shadow-purple-500/20 px-6 bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-5 w-5" /> Nova Tag
          </Button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Search */}
        <div className="max-w-md mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          <Input
            placeholder="Buscar tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12"
          />
        </div>

        {tags.length === 0 && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Sua lista de tags está vazia</h2>
            <p className="text-slate-500 max-w-sm mb-6">Crie etiquetas personalizadas ex: "viagem", "reforma", "assinaturas" para agrupar despesas de forma extra-categorizada.</p>
            <Button onClick={openCreate} size="lg" className="font-bold shadow-xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 px-8">
              <Plus className="mr-2 h-5 w-5" /> Criar Primeira Tag
            </Button>
          </motion.div>
        )}

        {/* Tags List */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {filtered.map((t: any) => (
              <motion.div 
                layout
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2 }}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 cursor-pointer max-w-full overflow-hidden flex items-center shadow-sm hover:shadow-md transition-all"
              >
                <div 
                  className="h-3 w-3 rounded-full mr-3 shrink-0"
                  style={{ backgroundColor: t.color || "#820AD1" }}
                />
                
                <span className="font-semibold text-slate-900 dark:text-white truncate pb-0.5">{t.name}</span>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 pl-2 rounded-l-xl">
                  <Button 
                    variant="ghost" size="icon" 
                    onClick={(e) => { e.stopPropagation(); openEdit(t); }} 
                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" size="icon" 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} 
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Etiqueta" : "Nova Etiqueta"} size="sm">
        <div className="space-y-4 pt-2">
          <Field label="Nome da Tag" required error={errors.name}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">#</span>
              <Input 
                placeholder="viagem, urgente..." 
                value={form.name} 
                onChange={e => set("name", e.target.value)} 
                className="pl-7 lowercase" 
                maxLength={50}
              />
            </div>
          </Field>
          
          <Field label="Cor Identificadora">
            <ColorPicker value={form.color} onChange={c => set("color", c)} />
          </Field>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700 mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={save} className="font-bold shadow-lg bg-purple-600 hover:bg-purple-700 text-white">
              <Save className="mr-2 h-4 w-4" /> {editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Etiqueta" size="sm">
        <div className="text-center py-4">
          <div className="h-14 w-14 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Confirmar Exclusão?</p>
          <p className="text-sm text-slate-500">Isso irá remover a tag do catálogo. (Ela permanecerá nas transações antigas no extrato como registro frio).</p>
        </div>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-bold">Cancelar</Button>
          <Button variant="destructive" onClick={confirmDelete} className="flex-1 font-bold shadow-lg shadow-red-500/20">Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
