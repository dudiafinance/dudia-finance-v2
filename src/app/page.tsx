"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SignIn, useUser, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthPortalPage() {
  const { isSignedIn, isLoaded } = useUser();

  // Log para monitorar a inicialização do Clerk
  useEffect(() => {
    console.log("[Clerk] Auth State Check:", { isLoaded, isSignedIn });
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor - Aparece instantaneamente */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Logo e Título - Aparecem instantaneamente */}
        <div className="mb-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-foreground text-background font-bold text-xl mb-4 shadow-precision">
            D.
          </div>
          <h1 className="text-sm font-bold text-foreground uppercase tracking-[0.4em]">Dudia Finance</h1>
          <p className="mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">Engenharia de Fluxo de Caixa v2.0</p>
        </div>

        {/* Estado de Carregamento Localizado */}
        <ClerkLoading>
          <div className="flex flex-col items-center justify-center gap-4 py-12 animate-in fade-in duration-500">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Terminal...</p>
          </div>
        </ClerkLoading>

        {/* Conteúdo Carregado */}
        <ClerkLoaded>
          {isSignedIn ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="p-8 rounded-lg border border-border/50 bg-secondary/20 shadow-precision">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-2">Sessão Ativa Detectada</h2>
                <p className="text-[11px] text-muted-foreground uppercase tracking-tight mb-8">O terminal está pronto para processamento de dados.</p>
                
                <Link href="/dashboard" className="block w-full">
                  <Button className="w-full h-14 text-[11px] font-bold uppercase tracking-[0.2em] shadow-precision bg-white text-black hover:bg-zinc-200 transition-all">
                    Entrar no Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Identidade autenticada via Clerk Infrastructure
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SignIn 
                appearance={{
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
                }}
                signUpUrl="/?mode=signup"
              />
            </div>
          )}
        </ClerkLoaded>

        {/* Footer - Aparece instantaneamente */}
        <div className="mt-16 text-center">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-30">
            © 2026 Dudia Infrastructure Group • Secure Terminal
          </p>
        </div>
      </div>
    </div>
  );
}
