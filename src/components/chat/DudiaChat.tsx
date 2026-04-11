"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Cpu, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DudiaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [input, setInput] = useState(""); // Managed manually now
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = (useChat as any)({
    api: "/api/chat",
    onError: (err: any) => {
        console.error("Chat Error:", err);
        setMessages((prev: any) => [
            ...prev,
            { id: Date.now().toString(), role: 'assistant', content: '⚠️ Erro na conexão com DUD.IA. Verifique sua chave de API nas configurações.' }
        ]);
    },
    onFinish: () => {
        // Optional: auto-check health after each interaction
    }
  });

  const messages = chat.messages as any[];
  const status = chat.status as string; // 'idle', 'streaming', etc.
  const isLoading = status === 'streaming' || chat.isLoading;
  const setMessages = chat.setMessages as any;
  const sendMessage = chat.sendMessage as any;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const messageToSend = input;
    setInput(""); // Clear input
    
    try {
      console.log("Sending message via sendMessage...");
      await sendMessage({ text: messageToSend });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Auto-open on first session mount
  useEffect(() => {
    if (!hasOpenedOnce) {
        const timer = setTimeout(() => {
            setIsOpen(true);
            setHasOpenedOnce(true);
            // Initial greeting
            setMessages([
                { id: '1', role: 'assistant', content: 'DUD.IA v2.0.4 Inicializado. Auditoria de contexto concluída. Como posso ajudar com seu fluxo de caixa hoje?' }
            ]);
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [hasOpenedOnce, setMessages]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Periodic health check (simplified for now)
  useEffect(() => {
    const check = async () => {
        try {
            // Simplified: we could call a dedicated health endpoint here
            // setHasAlert(true); // Testing pulse
        } catch (e) {}
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[520px] bg-background border border-border/50 shadow-2xl rounded-xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center text-background text-[10px] font-bold">D.</div>
                <span className="text-xs font-bold uppercase tracking-[0.2em]">DUD.IA</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-lg text-[11px] leading-relaxed",
                    m.role === "user" 
                      ? "bg-foreground text-background font-medium" 
                      : "bg-secondary/30 border border-border/50 text-foreground font-mono"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/30 border border-border/50 p-3 rounded-lg">
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log("Submitting chat...");
              handleSubmit(e);
            }} className="p-4 border-t border-border/50 bg-background flex gap-2">
              <input
                className="flex-1 bg-secondary/30 border border-border/50 rounded-md px-3 py-2 text-[11px] focus:outline-none focus:border-foreground transition-all font-medium"
                placeholder="Perguntar ao DUD.IA..."
                value={input}
                onChange={handleInputChange}
              />
              <Button type="submit" size="icon" className="h-9 w-9 bg-foreground text-background hover:bg-zinc-200" disabled={isLoading}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB - Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-precision transition-all duration-500",
          isOpen ? "bg-secondary border border-border" : "bg-foreground text-background",
          hasAlert && !isOpen && "ring-4 ring-red-500/50 animate-pulse border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Cpu className={cn("h-6 w-6", hasAlert && "text-red-500")} />}
      </motion.button>
    </div>
  );
}