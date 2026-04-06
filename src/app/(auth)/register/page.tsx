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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Conta criada com sucesso!</h1>
            <p className="mt-2 text-slate-600">
              Bem-vindo ao DUD.IA Finance, {name}!
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Um e-mail de boas-vindas foi enviado para <strong>{email}</strong>
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecionando para o dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-600">DUD.IA</h1>
          <p className="mt-2 text-slate-600">Financeiro Pessoal</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Criar Conta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Preencha seus dados para começar
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        req.met ? "bg-emerald-100" : "bg-slate-100"
                      }`}>
                        {req.met && <Check className="h-3 w-3 text-emerald-600" />}
                      </div>
                      <span className={req.met ? "text-emerald-600" : "text-slate-500"}>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-emerald-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 DUD.IA Finance. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
