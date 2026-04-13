"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearCache = () => {
    try {
      localStorage.removeItem("dudia-cache");
      localStorage.removeItem("dudia-preferences");
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      this.setState({ hasError: false, error: null });
      window.location.reload();
    }
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const errorMessage = this.state.error?.message || "Erro inesperado na aplicação";
      const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("Failed to");

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-6 py-12">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-precision">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border border-border/50 flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground">!</span>
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h2 className="text-base font-bold uppercase tracking-widest text-foreground">
              Algo deu errado
            </h2>
            <p className={cn(
              "text-xs font-medium leading-relaxed",
              isNetworkError ? "text-amber-500" : "text-muted-foreground"
            )}>
              {isNetworkError 
                ? "Houve um problema de conexão. Verifique sua internet ou tente novamente."
                : errorMessage}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button
              variant="outline"
              onClick={this.handleClearCache}
              className="flex-1 gap-2 h-11 text-[10px] font-bold uppercase tracking-widest border-border hover:bg-secondary"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Cache
            </Button>
            <Button
              onClick={this.handleReload}
              className="flex-1 gap-2 h-11 text-[10px] font-bold uppercase tracking-widest shadow-precision"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recarregar Página
            </Button>
          </div>

          <button
            onClick={this.handleDismiss}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Ignorar e continuar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
