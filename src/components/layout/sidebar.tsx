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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
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
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 hidden lg:flex flex-col border-r border-sidebar-border shadow-precision",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-sidebar-border/50 px-6", collapsed && "justify-center px-0")}>
          <motion.div 
            initial={{ x: -10, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center shadow-precision">
              <span className="text-background font-bold text-[10px]">D.</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none uppercase">Dudia</span>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Finance</span>
              </div>
            )}
          </motion.div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto no-scrollbar">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0 h-10 w-10 mx-auto"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-all", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                  >
                    {item.label}
                  </motion.span>
                )}
                
                {isActive && !collapsed && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-0.5 h-4 bg-foreground rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 bg-sidebar/50 backdrop-blur-md border-t border-sidebar-border/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-150",
              collapsed && "justify-center px-0 h-9 w-9 mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav (< lg) ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[72px] items-center justify-around border-t border-border bg-background pb-safe lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] text-[11px] font-bold uppercase tracking-tight transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "text-foreground" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] text-[11px] font-bold uppercase tracking-tight text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="h-6 w-6" />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── Mobile slide-in drawer ───────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden bg-background/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-full w-72 bg-sidebar text-sidebar-foreground shadow-precision flex flex-col border-r border-sidebar-border"
            >
              <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center shadow-precision">
                    <span className="text-background font-bold text-[10px]">D.</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-foreground leading-none uppercase">Dudia</span>
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Finance</span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 no-scrollbar">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
