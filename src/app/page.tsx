"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Shield, Zap, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background overflow-x-hidden">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-foreground flex items-center justify-center shadow-precision">
              <span className="text-background font-bold text-xs">D.</span>
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.3em]">Dudia</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoaded && (
              isSignedIn ? (
                <Link href="/dashboard">
                  <Button size="sm" className="h-9 px-6 text-[10px] font-bold uppercase tracking-widest shadow-precision">
                    Painel de Controle
                  </Button>
                </Link>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="text-[11px] font-bold uppercase tracking-widest text-zinc-100 hover:text-white transition-colors px-5 h-9 border border-zinc-700 hover:border-zinc-500 rounded-md">
                      Acessar Terminal
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="h-9 px-6 text-[11px] font-bold uppercase tracking-widest shadow-precision bg-white text-black hover:bg-zinc-200 transition-colors">
                      Criar Conta
                    </Button>
                  </SignUpButton>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="h-3 w-3" />
            <span>Versão 2.0 • Cyber-Precision UI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl mx-auto leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            ENGENHARIA DE <span className="text-muted-foreground">PRECISÃO</span> PARA SEU PATRIMÔNIO.
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-12 uppercase tracking-wide leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Um terminal financeiro de alta densidade projetado para quem exige clareza técnica e performance analítica absoluta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {isLoaded && (
              isSignedIn ? (
                <Link href="/dashboard">
                  <Button className="h-14 px-10 text-[11px] font-bold uppercase tracking-[0.2em] shadow-precision">
                    Ir para o Terminal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <Button className="h-14 px-10 text-[11px] font-bold uppercase tracking-[0.2em] shadow-precision group">
                      Provisionar Conta
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button variant="outline" className="h-14 px-10 text-[11px] font-bold uppercase tracking-[0.2em] border-border shadow-precision">
                      Já tenho conta
                    </Button>
                  </SignInButton>
                </>
              )
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 border border-border/40 rounded-lg overflow-hidden shadow-precision">
            <div className="bg-background p-10 group hover:bg-secondary/20 transition-colors">
              <BarChart3 className="h-6 w-6 mb-6 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Análise de Alta Densidade</h3>
              <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-tighter">
                Visualize todo o seu ecossistema financeiro em uma grade técnica otimizada para tomada de decisão rápida.
              </p>
            </div>
            
            <div className="bg-background p-10 group hover:bg-secondary/20 transition-colors">
              <Cpu className="h-6 w-6 mb-6 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Motor de Previsão IA</h3>
              <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-tighter">
                Algoritmos preditivos que analisam recorrências e projetam seu saldo acumulado para os próximos 12 meses.
              </p>
            </div>

            <div className="bg-background p-10 group hover:bg-secondary/20 transition-colors">
              <Shield className="h-6 w-6 mb-6 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Segurança de Infraestrutura</h3>
              <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-tighter">
                Autenticação de nível bancário via Clerk e integridade de dados garantida por arquitetura Neon PostgreSQL.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Callout */}
        <section className="container mx-auto px-6">
          <div className="rounded-lg bg-secondary/30 border border-border/50 p-12 text-center shadow-precision overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase mb-6">Pronto para assumir o controle?</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-10 max-w-xl mx-auto">
                Junte-se a usuários que transformaram sua gestão financeira através de engenharia e dados.
              </p>
              {isLoaded && !isSignedIn && (
                <SignUpButton mode="modal">
                  <Button className="h-12 px-12 text-[10px] font-bold uppercase tracking-widest shadow-precision">
                    Criar Identidade Digital
                  </Button>
                </SignUpButton>
              )}
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-foreground/5 blur-[120px] rounded-full" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[10px]">D.</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Dudia Finance</span>
          </div>
          <div className="flex gap-8 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Segurança</a>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
            © 2026 Dudia Infrastructure Group.
          </p>
        </div>
      </footer>
    </div>
  );
}
