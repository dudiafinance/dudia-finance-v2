"use client";

import { Component, type ReactNode } from "react";

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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center px-6">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center border border-border/50 shadow-precision">
            <span className="text-xl font-bold text-muted-foreground">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Algo deu errado
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider max-w-sm leading-relaxed">
              {this.state.error?.message || "Erro inesperado na aplicação"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-9 px-6 rounded bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-precision hover:opacity-90 transition-opacity"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
