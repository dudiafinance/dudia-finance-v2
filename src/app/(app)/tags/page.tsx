"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Tag, Save } from "lucide-react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/form-field";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";

type TagItem = {
  id: string;
  name: string;
  color?: string;
};

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

  const openEdit = (t: TagItem) => {
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
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao salvar etiqueta", "error");
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

  const typedTags = tags as unknown as TagItem[];
  const filtered = typedTags.filter((t) => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando etiquetas...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Catalogação Adicional</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Tags</h1>
          </div>

          <Button onClick={openCreate} className="h-9 px-6 text-[11px] font-bold uppercase shadow-precision">
            <Plus className="mr-2 h-3.5 w-3.5" /> Nova Etiqueta
          </Button>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Search */}
        <div className="max-w-xl mb-10 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <Input
            placeholder="Buscar por nome de etiqueta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-[13px] bg-secondary/30 border-border focus:bg-background shadow-precision"
          />
        </div>

        {tags.length === 0 && !searchTerm ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Tag className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma tag cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((t) => (
                <motion.div 
                  layout
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="group relative bg-background rounded-lg border border-border/50 p-5 cursor-pointer shadow-precision hover:border-border transition-all duration-300"
                  onClick={() => openEdit(t)}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div 
                      className="h-2 w-2 rounded-full border border-white/10"
                      style={{ backgroundColor: t.color || "#820AD1" }}
                    />
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-widest truncate">{t.name}</span>
                  </div>
                  
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all bg-background/80 backdrop-blur-sm pl-2">
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={(e) => { e.stopPropagation(); openEdit(t); }} 
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} 
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Subtle Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: `radial-gradient(circle at center, ${t.color}, transparent)` }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Etiqueta" : "Nova Etiqueta"} size="sm">
        <div className="space-y-8 pt-4">
          <Field label="Nome do Identificador" required error={errors.name}>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">#</span>
              <Input 
                placeholder="viagem, urgente..." 
                value={form.name} 
                onChange={e => set("name", e.target.value)} 
                className="pl-4 h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all lowercase" 
                maxLength={50}
              />
            </div>
          </Field>
          
          <Field label="Assinatura Cromática">
            <ColorPicker value={form.color} onChange={c => set("color", c)} />
          </Field>
          
          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelar</Button>
            <Button onClick={save} className="flex-[2] text-[11px] font-bold uppercase tracking-widest py-6 shadow-precision">
              {editingId ? "Salvar Alterações" : "Criar Etiqueta"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Tag" size="sm">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Remover Etiqueta?</h3>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">A tag será removida do catálogo global. Registros históricos manterão o nome como metadado estático.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Voltar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 text-[11px] font-bold uppercase tracking-widest py-6">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
    </div>
  );
}
