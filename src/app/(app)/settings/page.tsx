"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe, Key, Save, Loader2, Camera, Check, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
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
    openRouterApiKey: "",
    notificationPreferences: {
      budgetAlerts: true,
      recurringReminders: true,
      monthlyReports: true,
      promotions: false,
    }
  });

  // Initial Data Load
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        avatar: session.user.image ?? "",
      });
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setSettingsData({
          currency: data.currency || "BRL",
          locale: data.locale || "pt-BR",
          timezone: data.timezone || "America/Sao_Paulo",
          openRouterApiKey: data.openRouterApiKey || "",
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
        await update(); // Update session
        alert("Foto atualizada com sucesso!");
      } else {
        alert("Falha ao atualizar foto");
      }
    } catch (_e) {
      alert("Erro ao fazer upload da foto");
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
        await update();
        alert("Perfil atualizado!");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar perfil");
      }
    } catch (_err) {
      alert("Erro de conexão");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Security functions
  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("A nova senha e a confirmação não coincidem.");
      return;
    }

    setIsSavingSecurity(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      });
      
      if (res.ok) {
        alert("Senha alterada com sucesso!");
        setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao alterar senha");
      }
    } catch (_err) {
      alert("Erro de conexão");
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
        alert("Configurações atualizadas!");
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch (_err) {
      alert("Erro de conexão");
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
    { id: "api", label: "API Keys", icon: Key },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie suas preferências e segurança do sistema.</p>
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

          <div className="flex-1 min-w-0 max-w-4xl">
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Perfil do Usuário</h2>
                <p className="mt-1 text-sm text-slate-500">Gerencie suas informações pessoais</p>
                
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-3xl font-bold border-2 border-slate-200 dark:border-slate-600 overflow-hidden">
                        {isUploadingAvatar ? (
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white dark:border-slate-800 hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4" />
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
                    <div className="space-y-1">
                      <h3 className="font-medium text-slate-900 dark:text-white">Foto de Perfil</h3>
                      <p className="text-xs text-slate-500">Imagem em alta resolução via Vercel Blob.</p>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="mt-2 rounded-lg font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        {isUploadingAvatar ? "Enviando..." : "Alterar Foto"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nome Completo">
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12"
                      />
                    </Field>
                    <Field label="Endereço de Email">
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12"
                      />
                    </Field>
                  </div>

                  <Button 
                    className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20"
                    disabled={isSavingProfile}
                    onClick={handleProfileSave}
                  >
                    {isSavingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingProfile ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notificações</h2>
                <p className="mt-1 text-sm text-slate-500">Configure como você recebe alertas e lembretes</p>
                
                <div className="mt-6 space-y-4">
                  {[
                    { key: "budgetAlerts", label: "Alertas de Orçamento", desc: "Receba alertas quando os gastos atingirem 80% do limite orçado." },
                    { key: "recurringReminders", label: "Transações Recorrentes", desc: "Lembretes proativos sobre faturas e pagamentos programados." },
                    { key: "monthlyReports", label: "Relatórios Mensais", desc: "Um resumo automatizado dos seus ganhos e despesas a cada fechamento." },
                    { key: "promotions", label: "Promoções e Novidades", desc: "Novas features, dicas financeiras e anúncios do DUD.IA." },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="max-w-[70%]">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
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
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleSettingsSave} 
                      disabled={isSavingSettings}
                      className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20"
                    >
                      {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Preferências
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Segurança de Acesso</h2>
                <p className="mt-1 text-sm text-slate-500">Mantenha sua conta protegida atualizando sua senha com regularidade.</p>
                
                <div className="mt-6 space-y-6 max-w-lg">
                  <Field label="Senha Atual">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 pr-10"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Nova Senha">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </Field>
                  <Field label="Confirme a Nova Senha">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </Field>
                  <Button 
                    onClick={handleSecuritySave}
                    disabled={isSavingSecurity}
                    className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20"
                  >
                    {isSavingSecurity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    Atualizar Senha
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência Visual</h2>
                <p className="mt-1 text-sm text-slate-500">Escolha como o sistema se apresenta para você.</p>
                
                <div className="mt-6">
                  <div className="flex gap-4 max-w-lg">
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
                        <span className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-1",
                           theme === t || (t === "system" && !theme) ? "text-blue-600 dark:text-blue-400" : "text-slate-500"
                        )}>
                          {theme === t && <Check className="h-3 w-3" />}
                          {t}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "regional" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Opções Regionais</h2>
                <p className="mt-1 text-sm text-slate-500">Configure localização, moeda e adequação temporal.</p>
                
                <div className="mt-6 space-y-6 max-w-lg">
                  <Field label="Moeda Padrão do Sistema">
                    <Select 
                      className="h-12"
                      value={settingsData.currency}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="BRL">R$ - Real Brasileiro</option>
                      <option value="USD">US$ - Dólar Americano</option>
                      <option value="EUR">€ - Euro</option>
                    </Select>
                  </Field>
                  <Field label="Idioma da Interface">
                    <Select 
                      className="h-12"
                      value={settingsData.locale}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, locale: e.target.value }))}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                    </Select>
                  </Field>
                  <Field label="Fuso Horário Específico">
                    <Select 
                      className="h-12"
                      value={settingsData.timezone}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                    </Select>
                  </Field>
                  <Button 
                    onClick={handleSettingsSave}
                    disabled={isSavingSettings}
                    className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20"
                  >
                    {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inteligência Artificial (OpenRouter)</h2>
                <p className="mt-1 text-sm text-slate-500">Conecte sua própria chave de API para habilitar as funções de IA dentro do seu ecossistema financeiro DUD.IA.</p>
                
                <div className="mt-8">
                  <div className="mb-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Key className="h-4 w-4" /> Como obter sua chave:
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-blue-700/80 dark:text-blue-200/70 space-y-2">
                      <li>Acesse <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="font-semibold underline hover:text-blue-900 dark:hover:text-white">openrouter.ai</a> e crie ou acesse sua conta.</li>
                      <li>Navegue até a seção <strong>&quot;Keys&quot;</strong>.</li>
                      <li>Clique em <strong>&quot;Create Key&quot;</strong>, dê um nome (ex: Dud.ia Finance) e copie o código gerado.</li>
                      <li>Cole o código no campo abaixo e salve.</li>
                    </ol>
                  </div>

                  <Field label="Chave de API do OpenRouter">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={settingsData.openRouterApiKey}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, openRouterApiKey: e.target.value }))}
                          placeholder="sk-or-v1-..."
                          className="h-12 font-mono"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button 
                        onClick={handleSettingsSave}
                        disabled={isSavingSettings}
                        className="h-12 px-8 font-bold shadow-lg shadow-blue-500/20 shrink-0"
                      >
                        {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Chave"}
                      </Button>
                    </div>
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}