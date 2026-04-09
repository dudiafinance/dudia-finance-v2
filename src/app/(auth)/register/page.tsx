"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const passwordRequirements = [
    { met: password.length >= 8, text: "Mínimo 8 caracteres" },
    { met: /[A-Z]/.test(password), text: "Uma letra maiúscula" },
    { met: /[a-z]/.test(password), text: "Uma letra minúscula" },
    { met: /[0-9]/.test(password), text: "Um número" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRequirements.every((r) => r.met)) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conta.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Conta criada, mas não foi possível fazer login automaticamente.");
        setIsLoading(false);
        setSuccess(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
      setSuccess(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="mb-12">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded bg-secondary border border-border shadow-precision">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-sm font-bold text-foreground uppercase tracking-[0.2em]">Identidade Criada</h1>
            <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Bem-vindo ao ecossistema Dudia, {name.split(' ')[0]}.
            </p>
            <div className="mt-12 flex items-center justify-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              <span>Sincronizando Terminal...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-foreground text-background font-bold text-xl mb-4 shadow-precision">D.</div>
          <h1 className="text-sm font-bold text-foreground uppercase tracking-[0.3em]">Dudia Finance</h1>
          <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Provisionamento de Nova Conta</p>
        </div>

        <div className="rounded-lg bg-background p-8 shadow-precision border border-border/50">
          <div className="mb-8">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Cadastro</h2>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              Registre sua identidade financeira
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm font-medium outline-none focus:border-foreground transition-all"
                placeholder="Ex: João da Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identificador (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm font-medium outline-none focus:border-foreground transition-all"
                placeholder="nome@provedor.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm font-medium outline-none focus:border-foreground transition-all pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              
              {password && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={cn("h-1 w-1 rounded-full", req.met ? "bg-emerald-500" : "bg-border")} />
                      <span className={cn("text-[8px] font-bold uppercase tracking-tight", req.met ? "text-emerald-500" : "text-muted-foreground")}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordRequirements.every((r) => r.met)}
              className="w-full h-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-precision py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Provisionando...
                </>
              ) : (
                "Gerar Conta"
              )}
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-border/50 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Já possui registro?{" "}
              <Link href="/login" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-all">
                Autenticar
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
          © 2026 Dudia Finance • Security Infrastructure
        </p>
      </div>
    </div>
  );
}