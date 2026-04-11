"use client";

import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, Info, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Pill = {
  title: string;
  content: string;
  type: "warning" | "info" | "success";
};

const getIcon = (type: Pill["type"]) => {
  switch (type) {
    case "warning": return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />;
    case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    default: return <Info className="h-3.5 w-3.5 text-blue-500" />;
  }
};

export function AIInsightsPills() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/insights");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPills(data);
    } catch (e) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[280px] h-20 bg-secondary/50 rounded-lg animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  // Se não houver insights, mostra um estado de boas-vindas
  if (pills.length === 0) {
    const defaultPills: Pill[] = [
      { title: "Boas-vindas", content: "Adicione seus primeiros lançamentos para receber insights personalizados da nossa IA.", type: "info" },
      { title: "Dica de Hoje", content: "Organize seus gastos por categorias para ter uma visão clara do seu fluxo de caixa.", type: "success" },
      { title: "Meta", content: "Defina uma meta financeira para que a IA possa te ajudar a alcançá-la mais rápido.", type: "warning" }
    ];
    
    return (
      <div className="relative mb-10 group">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Iniciando IA Dudia</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {defaultPills.map((pill, idx) => (
            <div key={idx} className="min-w-[280px] flex-1 bg-background rounded-lg border border-border/50 p-4 shadow-precision flex flex-col gap-1.5 opacity-70">
              <div className="flex items-center gap-2">
                {getIcon(pill.type)}
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{pill.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">{pill.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-10 group">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Insights de IA (Modelos Free)</span>
        <button 
          onClick={fetchInsights}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
        >
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        <AnimatePresence mode="popLayout">
          {pills.map((pill, idx) => (
            <motion.div
              key={pill.title + idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "min-w-[280px] flex-1 bg-background rounded-lg border border-border/50 p-4 shadow-precision hover:border-border transition-all",
                "flex flex-col gap-1.5"
              )}
            >
              <div className="flex items-center gap-2">
                {getIcon(pill.type)}
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                  {pill.title}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                {pill.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}