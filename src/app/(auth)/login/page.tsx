"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos.");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-foreground text-background font-bold text-xl mb-4 shadow-precision">D.</div>
          <h1 className="text-sm font-bold text-foreground uppercase tracking-[0.3em]">Dudia Finance</h1>
          <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocolo de Acesso v2.0</p>
        </div>

        <div className="rounded-lg bg-background p-8 shadow-precision border border-border/50">
          <div className="mb-8">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Autenticação</h2>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              Insira suas credenciais de rede
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chave de Acesso</label>
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="h-4 w-4 rounded border-zinc-700 text-foreground focus:ring-zinc-500 bg-transparent" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">Manter Conexão</span>
              </label>
              <Link href="/forgot-password" hidden className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight hover:text-foreground transition-colors">
                Recuperar
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-precision py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-border/50 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Novo no Dudia?{" "}
              <Link href="/register" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-all">
                Criar Identidade
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
          © 2026 Dudia Finance • Secure Terminal
        </p>
      </div>
    </div>
  );
}
