"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe, Save, Loader2, Camera, Eye, EyeOff } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // States for each section
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [settingsData, setSettingsData] = useState({
    currency: "BRL",
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    notificationPreferences: {
      budgetAlerts: true,
      recurringReminders: true,
      monthlyReports: true,
      promotions: false,
    }
  });

  // Initial Data Load
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.fullName ?? "",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        avatar: user.imageUrl ?? "",
      });
      fetchSettings();
    }
   
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setSettingsData({
          currency: data.currency || "BRL",
          locale: data.locale || "pt-BR",
          timezone: data.timezone || "America/Sao_Paulo",
          notificationPreferences: data.notificationPreferences || {
            budgetAlerts: true,
            recurringReminders: true,
            monthlyReports: true,
            promotions: false,
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  // Profile functions
  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const res = await fetch(`/api/user/avatar/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (res.ok) {
        const blob = await res.json();
        setProfileData(prev => ({ ...prev, avatar: blob.url }));
        await user?.reload();
        toast("Foto atualizada com sucesso!", "success");
      } else {
        toast("Falha ao atualizar foto", "error");
      }
    } catch (_e) {
      toast("Erro ao fazer upload da foto", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        await user?.reload();
        toast("Perfil atualizado!", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Erro ao salvar perfil", "error");
      }
    } catch (_err) {
      toast("Erro de conexão", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Security functions — uses Clerk client-side password update (no custom endpoint needed)
  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast("A nova senha e a confirmação não coincidem.", "error");
      return;
    }

    if (!securityData.currentPassword || !securityData.newPassword) {
      toast("Preencha todos os campos de senha.", "error");
      return;
    }

    if (!user) {
      toast("Usuário não autenticado.", "error");
      return;
    }

    setIsSavingSecurity(true);
    try {
      await user.updatePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        signOutOfOtherSessions: false,
      });
      toast("Senha alterada com sucesso!", "success");
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha";
      toast(msg, "error");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // Settings functions (Regional, API, Notifications)
  const handleSettingsSave = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (res.ok) {
        toast("Configurações atualizadas!", "success");
      } else {
        toast("Erro ao salvar configurações", "error");
      }
    } catch (_err) {
      toast("Erro de conexão", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "regional", label: "Regional", icon: Globe },
  ];

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Parâmetros do Sistema</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase">Configurações</h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tab nav */}
          <div className="lg:w-64 lg:shrink-0">
            <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:space-y-1 lg:overflow-x-visible lg:pb-0 no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex shrink-0 items-center justify-start gap-4 rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all lg:w-full group",
                    activeTab === tab.id
                      ? "bg-foreground text-background shadow-precision"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <tab.icon className={cn("h-3.5 w-3.5 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-background" : "text-muted-foreground")} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 min-w-0 max-w-4xl">
            {activeTab === "profile" && (
              <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Perfil do Usuário</h2>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">Gerenciamento de identidade e presença</p>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="h-24 w-24 rounded flex items-center justify-center bg-secondary text-foreground text-3xl font-bold border border-border/50 shadow-precision overflow-hidden">
                        {isUploadingAvatar ? (
                          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                        ) : profileData.avatar ? (
                          <Image
                            src={profileData.avatar}
                            alt={profileData.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          profileData.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute -bottom-2 -right-2 p-2 bg-foreground text-background rounded border border-background hover:scale-110 transition-all shadow-precision disabled:opacity-50"
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
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Foto de Identificação</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">PNG, JPG ou WEBP. Máx 2MB.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="h-7 text-[9px] font-bold uppercase border-border"
                      >
                        {isUploadingAvatar ? "Processando..." : "Substituir Imagem"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/30">
                    <Field label="Nome de Exibição">
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all"
                      />
                    </Field>
                    <Field label="Endereço de Comunicação">
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all"
                      />
                    </Field>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="h-11 px-10 font-bold uppercase text-[10px] tracking-widest shadow-precision"
                      disabled={isSavingProfile}
                      onClick={handleProfileSave}
                    >
                      {isSavingProfile ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-3.5 w-3.5" />
                      )}
                      Efetivar Alterações
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Alertas & Notificações</h2>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">Configuração de canais e gatilhos</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "budgetAlerts", label: "Controle de Budget", desc: "Avisos proativos ao atingir 80% do teto definido nas categorias." },
                    { key: "recurringReminders", label: "Fluxos Recorrentes", desc: "Lembretes diários sobre faturas a vencer e pagamentos agendados." },
                    { key: "monthlyReports", label: "Sumário Executivo", desc: "Envio de relatório consolidado no fechamento de cada ciclo mensal." },
                    { key: "promotions", label: "Updates do Sistema", desc: "Informativos sobre novas features e melhorias no ecossistema DUD.IA." },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-5 border-b border-border/30 last:border-0">
                      <div className="max-w-[70%]">
                        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsData.notificationPreferences[item.key as keyof typeof settingsData.notificationPreferences]}
                          onChange={(e) => setSettingsData(prev => ({
                            ...prev,
                            notificationPreferences: { ...prev.notificationPreferences, [item.key]: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-secondary border border-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-muted-foreground after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
                      </label>
                    </div>
                  ))}

                  <div className="pt-8">
                    <Button
                      onClick={handleSettingsSave}
                      disabled={isSavingSettings}
                      className="h-11 px-10 font-bold uppercase text-[10px] tracking-widest shadow-precision"
                    >
                      {isSavingSettings ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                      Atualizar Preferências
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Segurança & Autenticação</h2>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">Proteção de acesso e integridade de dados</p>
                </div>

                <div className="space-y-8 max-w-lg">
                  <Field label="Senha Vigente">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all pr-10"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Nova Credencial">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all"
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </Field>
                    <Field label="Confirmação de Senha">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-10 text-sm font-medium border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground transition-all"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSecuritySave}
                      disabled={isSavingSecurity}
                      className="h-11 px-10 font-bold uppercase text-[10px] tracking-widest shadow-precision"
                    >
                      {isSavingSecurity ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Shield className="mr-2 h-3.5 w-3.5" />}
                      Atualizar Credenciais
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Interface Visual</h2>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">Customização de tema e modo de exibição</p>
                </div>

                <div className="mt-6">
                  <div className="flex gap-4 max-w-lg">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-4 rounded-lg border p-8 transition-all group shadow-precision",
                          theme === t || (t === "system" && !theme)
                            ? "border-foreground/20 bg-secondary ring-1 ring-foreground/5"
                            : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/30"
                        )}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded flex items-center justify-center text-2xl transition-transform group-hover:scale-110",
                          theme === t || (t === "system" && !theme) ? "bg-foreground shadow-precision" : "bg-secondary"
                        )}>
                          {t === "light" && "☀️"}
                          {t === "dark" && "🌙"}
                          {t === "system" && "💻"}
                        </div>
                        <div className="flex items-center gap-2">
                          {theme === t && <div className="h-1.5 w-1.5 rounded-full bg-foreground" />}
                          <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                             theme === t || (t === "system" && !theme) ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {t}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "regional" && (
              <div className="bg-background rounded-lg border border-border/50 p-8 shadow-precision">
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Localização & Moeda</h2>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">Parâmetros de formatação e adequação temporal</p>
                </div>

                <div className="mt-6 space-y-8 max-w-lg">
                  <Field label="Moeda de Referência">
                    <Select
                      className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground font-bold tracking-widest"
                      value={settingsData.currency}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="BRL">R$ - Real Brasileiro</option>
                      <option value="USD">US$ - Dólar Americano</option>
                      <option value="EUR">€ - Euro</option>
                    </Select>
                  </Field>
                  <Field label="Padronização de Idioma">
                    <Select
                      className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                      value={settingsData.locale}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, locale: e.target.value }))}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                    </Select>
                  </Field>
                  <Field label="Fuso Horário Operacional">
                    <Select
                      className="h-10 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
                      value={settingsData.timezone}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                    </Select>
                  </Field>

                  <div className="pt-4">
                    <Button
                      onClick={handleSettingsSave}
                      disabled={isSavingSettings}
                      className="h-11 px-10 font-bold uppercase text-[10px] tracking-widest shadow-precision"
                    >
                      {isSavingSettings ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                      Salvar Parâmetros
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
