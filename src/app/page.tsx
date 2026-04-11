"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignIn, SignUp, useUser, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { ArrowRight, Loader2, Target, Zap, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function AuthContent() {
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "signin";

  const appearance = {
    elements: {
      rootBox: "w-full",
      card: "bg-background border border-border/50 shadow-precision rounded-lg",
      headerTitle: "text-sm font-bold uppercase tracking-widest text-foreground",
      headerSubtitle: "text-[10px] font-bold uppercase tracking-tight text-muted-foreground",
      socialButtonsBlockButton: "border-border/50 hover:bg-secondary transition-all text-foreground",
      formButtonPrimary: "bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-widest h-11 transition-all shadow-precision border-0",
      formFieldLabel: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
      formFieldInput: "bg-secondary/30 border-border/50 focus:border-foreground transition-all rounded-md h-10 text-sm",
      footerActionLink: "text-foreground font-bold hover:text-muted-foreground transition-colors",
      dividerText: "text-[9px] font-bold uppercase text-muted-foreground/50",
      dividerLine: "bg-border/30",
      identityPreviewText: "text-foreground font-bold",
      formFieldAction: "text-foreground font-bold hover:text-muted-foreground",
      otpCodeFieldInput: "bg-secondary/30 border-border/50 focus:border-foreground"
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
      <div className="w-full max-w-sm space-y-8">
        <ClerkLoading>
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Terminal...</p>
          </div>
        </ClerkLoading>

        <ClerkLoaded>
          {isSignedIn ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="p-8 rounded-lg border border-border/50 bg-secondary/10 shadow-precision backdrop-blur-sm">
                <div className="h-16 w-16 rounded-full bg-foreground mx-auto mb-6 flex items-center justify-center text-background text-xl font-bold">
                  {user?.firstName?.charAt(0) || "U"}
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-1">Bem-vindo de volta</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-8">Sessão Ativa: {user?.fullName}</p>
                
                <Link href="/dashboard" className="block w-full">
                  <Button className="w-full h-14 text-[11px] font-bold uppercase tracking-[0.2em] shadow-precision bg-white text-black hover:bg-zinc-200 transition-all">
                    Entrar no Terminal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <Link 
                    href="/?mode=signin" 
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-colors",
                        mode === 'signin' ? "text-foreground border-b-2 border-foreground pb-1" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Acessar
                </Link>
                <Link 
                    href="/?mode=signup" 
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-colors",
                        mode === 'signup' ? "text-foreground border-b-2 border-foreground pb-1" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Criar Conta
                </Link>
              </div>

              {mode === 'signup' ? (
                <SignUp appearance={appearance} fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
              ) : (
                <SignIn appearance={appearance} fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
              )}
            </motion.div>
          )}
        </ClerkLoaded>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row relative overflow-hidden">
      {/* Visual Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Left Column: Manifesto/About */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-border/50 bg-secondary/5 z-10">
        <div className="space-y-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded bg-foreground text-background font-bold text-lg shadow-precision">
                    D.
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">DUDIA Infrastructure</span>
                    <span className="text-[8px] font-mono text-muted-foreground uppercase opacity-60">System v2.0.4 // Production Build</span>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md space-y-6">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter leading-[0.9] uppercase italic italic">
                    Engenharia <br/> 
                    <span className="text-muted-foreground">de Fluxo de</span> <br/>
                    Caixa.
                </h1>
                <p className="text-[11px] font-medium text-muted-foreground uppercase leading-relaxed tracking-wider">
                    DUDIA não é apenas um gestor financeiro. É um terminal de alta precisão 
                    desenvolvido para quem enxerga patrimônio como um sistema de engenharia.
                    Auditoria atômica, roteamento de IA e análise preditiva em um único ecossistema.
                </p>
            </div>

            {/* Features Mini Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {[
                    { icon: Target, title: "Precisão Atômica", desc: "Cálculos garantidos em centavos sem erros de arredondamento." },
                    { icon: Cpu, title: "Inteligência IA", desc: "Insights automáticos via Gemini 2.0 e DeepSeek de custo zero." },
                    { icon: ShieldCheck, title: "Auditoria E2E", desc: "Mecanismo de self-healing para consistência total de extrato." },
                    { icon: Zap, title: "Alta Densidade", desc: "Interface otimizada para visualização rápida de métricas complexas." },
                ].map((f, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <f.icon className="h-3 w-3 text-foreground" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">{f.title}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase leading-tight opacity-70">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer info */}
        <div className="pt-12">
            <div className="flex gap-4 items-center opacity-30 grayscale pointer-events-none">
                <div className="h-6 w-20 bg-muted-foreground/20 rounded" />
                <div className="h-6 w-16 bg-muted-foreground/20 rounded" />
                <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
            </div>
            <p className="mt-8 text-[8px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                Built with precision architecture • End-to-End Encrypted Identity
            </p>
        </div>
      </div>

      {/* Right Column: Auth */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}