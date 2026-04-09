"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Tag,
  Layers,
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
  { href: "/credit-cards", icon: CreditCard, label: "Cartões" },
  { href: "/goals", icon: Target, label: "Metas" },
  { href: "/budgets", icon: PiggyBank, label: "Orçamentos" },
  { href: "/accounts", icon: Wallet, label: "Contas" },
  { href: "/categories", icon: Layers, label: "Categorias" },
  { href: "/tags", icon: Tag, label: "Tags" },
  { href: "/forecast", icon: TrendingUp, label: "Previsão" },
  { href: "/reports", icon: BarChart3, label: "Relatórios" },
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
          "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 hidden lg:flex flex-col border-r border-slate-800 shadow-2xl",
          collapsed ? "w-22" : "w-64"
        )}
      >
        <div className={cn("flex h-20 items-center border-b border-slate-800/50 px-6", collapsed && "justify-center px-0")}>
          {collapsed ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              <span className="text-white font-bold text-xs tracking-tighter">DF</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ x: -10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">DUDIA</span>
                <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mt-0.5">Finance</span>
              </div>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto scrollbar-none">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
                  collapsed && "justify-center px-0 h-12 w-12 mx-auto"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {item.label}
                  </motion.span>
                )}
                
                {isActive && !collapsed && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  />
                )}

                {collapsed && (
                  <div className="absolute left-full ml-4 rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2 bg-slate-900/50 backdrop-blur-md border-t border-slate-800/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-800/50 hover:text-white transition-all duration-200",
              collapsed && "justify-center px-0 h-10 w-10 mx-auto"
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
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group",
              collapsed && "justify-center px-0 h-10 w-10 mx-auto"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span>Encerrar Sessão</span>}
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