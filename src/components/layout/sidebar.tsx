"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Tags,
  Wallet,
  CreditCard,
  PiggyBank,
  Target,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useMobileNav } from "./mobile-nav-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transações" },
  { href: "/categories", icon: Tags, label: "Categorias" },
  { href: "/accounts", icon: Wallet, label: "Contas" },
  { href: "/credit-cards", icon: CreditCard, label: "Cartões" },
  { href: "/budgets", icon: PiggyBank, label: "Orçamentos" },
  { href: "/goals", icon: Target, label: "Metas" },
  { href: "/reports", icon: BarChart3, label: "Relatórios" },
  { href: "/forecast", icon: TrendingUp, label: "Previsão" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

const bottomNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transações" },
  { href: "/accounts", icon: Wallet, label: "Contas" },
  { href: "/credit-cards", icon: CreditCard, label: "Cartões" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { open, setOpen } = useMobileNav();

  return (
    <>
      {/* ── Desktop sidebar (lg+) ────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 hidden lg:flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center justify-center border-b border-slate-800", !collapsed && "px-4")}>
          {collapsed ? (
            <span className="text-xl font-bold text-emerald-400">D</span>
          ) : (
            <span className="text-xl font-bold text-emerald-400">DUD.IA</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white",
              collapsed && "px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white",
              collapsed && "px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav (< lg) ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
                isActive ? "text-emerald-600" : "text-slate-500 dark:text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-slate-500 dark:text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Mais button */}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── Mobile drawer overlay ────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile slide-in drawer ───────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:hidden flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <span className="text-xl font-bold text-emerald-400">DUD.IA</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
