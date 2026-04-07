"use client";

import { useState, useRef, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe, Key, Save, Loader2, Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        avatar: session.user.image ?? "",
      });
    }
  }, [session]);

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "regional", label: "Regional", icon: Globe },
    { id: "api", label: "API Keys", icon: Key },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie suas preferências.</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tab nav */}
          <div className="lg:w-56 lg:shrink-0">
            <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:space-y-1 lg:overflow-x-visible lg:pb-0">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center justify-start gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all lg:w-full shadow-none",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 lg:h-5 lg:w-5", activeTab === tab.id ? "text-white" : "text-slate-400")} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab" 
                      className="absolute left-0 w-1 h-6 bg-white rounded-full lg:block hidden" 
                    />
                  )}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Perfil do Usuário</h2>
                <p className="mt-1 text-sm text-slate-500">Gerencie suas informações pessoais</p>
                
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-2xl font-bold border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
                        {formData.avatar ? (
                          <img 
                            src={formData.avatar} 
                            alt={formData.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          formData.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white dark:border-slate-800 hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-slate-900 dark:text-white">Foto de Perfil</h3>
                      <p className="text-xs text-slate-500">JPG, PNG ou GIF. Máximo de 2MB.</p>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 rounded-lg font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        Alterar Foto
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nome Completo">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12"
                      />
                    </Field>
                    <Field label="Endereço de Email">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12"
                      />
                    </Field>
                  </div>

                  <Button 
                    className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20"
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const res = await fetch("/api/user/profile", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(formData),
                        });
                        
                        if (res.ok) {
                          await update();
                          alert("Perfil atualizado!");
                        } else {
                          const data = await res.json();
                          alert(data.error || "Erro ao salvar perfil");
                        }
                      } catch (err) {
                        alert("Erro de conexão");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notificações</h2>
                <p className="mt-1 text-sm text-slate-500">Configure como você recebe notificações</p>
                
                <div className="mt-6 space-y-4">
                  {[
                    { label: "Alertas de Orçamento", desc: "Receba alertas quando estiver perto do limite" },
                    { label: "Lembretes de Transações Recorrentes", desc: "Notificações sobre transações programadas" },
                    { label: "Relatórios Mensais", desc: "Resumo mensal do seu finances" },
                    { label: "Promoções e Novidades", desc: "Novidades sobre o DUD.IA Finance" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Segurança</h2>
                <p className="mt-1 text-sm text-slate-500">Gerencie sua senha e autenticação</p>
                
                <div className="mt-6 space-y-6">
                  <Field label="Senha Atual">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12"
                    />
                  </Field>
                  <Field label="Nova Senha">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12"
                    />
                  </Field>
                  <Field label="Confirmar Senha">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12"
                    />
                  </Field>
                  <Button className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20">
                    <Save className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência</h2>
                <p className="mt-1 text-sm text-slate-500">Personalize a interface do aplicativo</p>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Tema</label>
                  <div className="flex gap-4">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        onClick={() => setTheme(t)}
                        className={cn(
                          "flex-1 h-auto flex-col gap-3 rounded-2xl border-2 p-6 transition-all",
                          theme === t || (t === "system" && !theme)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-blue-500/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        <span className="text-4xl filter drop-shadow-sm">
                          {t === "light" && "☀️"}
                          {t === "dark" && "🌙"}
                          {t === "system" && "💻"}
                        </span>
                        <span className={cn("text-xs font-bold uppercase tracking-widest",
                           theme === t || (t === "system" && !theme) ? "text-blue-600 dark:text-blue-400" : "text-slate-500"
                        )}>{t}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "regional" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Regional</h2>
                <p className="mt-1 text-sm text-slate-500">Configure idioma, moeda e fuso horário</p>
                
                <div className="mt-6 space-y-6">
                  <Field label="Moeda Principal">
                    <Select className="h-12">
                      <option>BRL - Real Brasileiro</option>
                      <option>USD - Dólar Americano</option>
                      <option>EUR - Euro</option>
                    </Select>
                  </Field>
                  <Field label="Idioma do Sistema">
                    <Select className="h-12">
                      <option>Português (Brasil)</option>
                      <option>English (US)</option>
                    </Select>
                  </Field>
                  <Field label="Fuso Horário">
                    <Select className="h-12">
                      <option>America/Sao_Paulo (GMT-3)</option>
                      <option>America/New_York (GMT-5)</option>
                      <option>Europe/London (GMT+0)</option>
                    </Select>
                  </Field>
                  <Button className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API Keys</h2>
                <p className="mt-1 text-sm text-slate-500">Gerencie chaves de API para integrações</p>
                
                <div className="mt-6">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">OpenRouter API Key</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">sk-or-v1-••••••••••••••••••••••••</p>
                  </div>
                  <Button variant="secondary" className="mt-4 font-bold bg-slate-100 dark:bg-slate-700">
                    Atualizar API Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}