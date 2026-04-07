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
import { motion, AnimatePresence } from "framer-motion";
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
          "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-200 hidden lg:flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-slate-700", !collapsed && "px-6")}>
          {collapsed ? (
            <span className="w-full text-center text-lg font-bold text-blue-400 tracking-tight">DF</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">Finance</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
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

        <div className="border-t border-slate-700 p-3 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150",
              collapsed && "justify-center px-2"
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
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav (< lg) ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-500 dark:text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── Mobile drawer overlay ────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile slide-in drawer ───────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-slate-900 text-white shadow-xl transition-transform duration-200 lg:hidden flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DF</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Finance</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}