"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useTheme } from "next-themes";
import { useEffect } from "react";
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
        <Sidebar />
        <div className="relative z-0 lg:pl-64 pb-20 lg:pb-0 min-h-screen flex flex-col">
          <Header />
          <main className="p-4 lg:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}