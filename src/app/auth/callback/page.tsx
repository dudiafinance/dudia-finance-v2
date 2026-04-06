"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Pega os parâmetros do Supabase
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const type = searchParams.get("type");

        if (!accessToken) {
          setStatus("error");
          setMessage("Token de confirmação não encontrado");
          return;
        }

        // Decodifica o JWT para pegar o email
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const email = payload.email;

        if (!email) {
          setStatus("error");
          setMessage("Email não encontrado no token");
          return;
        }

        // Sincroniza com nosso banco
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email confirmado com sucesso! Você pode fazer login agora.");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Erro ao confirmar email");
        }
      } catch {
        setStatus("error");
        setMessage("Erro ao processar confirmação");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
          <p className="mt-4 text-slate-600">Confirmando seu email...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Email Confirmado!</h2>
          <p className="mt-2 text-slate-600">{message}</p>
          <p className="mt-4 text-sm text-slate-500">Redirecionando para o login...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Erro</h2>
          <p className="mt-2 text-slate-600">{message}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Ir para Login
          </button>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-600">DUD.IA</h1>
          <p className="mt-2 text-slate-600">Financeiro Pessoal</p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-slate-600">Carregando...</p>
            </div>
          }
        >
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}