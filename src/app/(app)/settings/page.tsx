"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Globe, Key, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "regional", label: "Regional", icon: Globe },
    { id: "api", label: "API Keys", icon: Key },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Tab nav - horizontal scrollable on mobile, vertical sidebar on desktop */}
        <div className="lg:w-64 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:space-y-1 lg:overflow-x-visible lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Perfil do Usuário</h2>
              <p className="mt-1 text-sm text-slate-500">Gerencie suas informações pessoais</p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <Button variant="outline">Alterar Foto</Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nome</label>
                    <input
                      type="text"
                      defaultValue={userName}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      defaultValue={userEmail}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Notificações</h2>
              <p className="mt-1 text-sm text-slate-500">Configure como você recebe notificações</p>
              
              <div className="mt-6 space-y-4">
                {[
                  { label: "Alertas de Orçamento", desc: "Receba alertas quando estiver perto do limite" },
                  { label: "Lembretes de Transações Recorrentes", desc: "Notificações sobre transações programadas" },
                  { label: "Relatórios Mensais", desc: "Resumo mensal do seu finances" },
                  { label: "Promoções e Novidades", desc: "Novidades sobre o DUD.IA Finance" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Segurança</h2>
              <p className="mt-1 text-sm text-slate-500">Gerencie sua senha e autenticação</p>
              
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Senha Atual</label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nova Senha</label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Confirmar Senha</label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência</h2>
              <p className="mt-1 text-sm text-slate-500">Personalize a interface do aplicativo</p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Tema</label>
                  <div className="flex gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 rounded-lg border-2 p-4 text-center transition-colors ${
                          theme === t || (t === "system" && !theme)
                            ? t === "light" 
                              ? "border-emerald-500 bg-emerald-50"
                              : t === "dark"
                                ? "border-emerald-500 bg-emerald-900/20"
                                : "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {t === "light" && "☀️"}
                        {t === "dark" && "🌙"}
                        {t === "system" && "💻"}
                        <span className="block text-sm font-medium capitalize mt-1 text-slate-900 dark:text-white">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "regional" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Regional</h2>
              <p className="mt-1 text-sm text-slate-500">Configure idioma, moeda e fuso horário</p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Moeda</label>
                  <select className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option>BRL - Real Brasileiro</option>
                    <option>USD - Dólar Americano</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Idioma</label>
                  <select className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option>Português (Brasil)</option>
                    <option>English (US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Fuso Horário</label>
                  <select className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option>America/Sao_Paulo (GMT-3)</option>
                    <option>America/New_York (GMT-5)</option>
                    <option>Europe/London (GMT+0)</option>
                  </select>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
              <p className="mt-1 text-sm text-slate-500">Gerencie chaves de API para integrações</p>
              
              <div className="mt-6">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">OpenRouter API Key</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">sk-or-v1-••••••••••••••••••••••••</p>
                </div>
                <Button variant="outline" className="mt-4">
                  Atualizar API Key
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
