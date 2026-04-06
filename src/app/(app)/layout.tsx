"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="lg:pl-64 pb-20 lg:pb-0">
          <Header />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </MobileNavProvider>
  );
}