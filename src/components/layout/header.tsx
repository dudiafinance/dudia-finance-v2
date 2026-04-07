"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMobileNav } from "./mobile-nav-context";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Header() {
  const { data: session } = useSession();
  const { setOpen } = useMobileNav();
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/50 bg-white/80 px-6 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800/50 transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden lg:block group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar transações ou contas..."
            className="h-11 w-80 rounded-xl border border-slate-200/60 bg-slate-100/50 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:bg-slate-900/50 dark:border-slate-800/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <NotificationBell />

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <motion.div 
          whileHover={{ y: -1 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="hidden text-right lg:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{name}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-0.5">{email ? email.split('@')[0] : 'Usuário'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold select-none overflow-hidden shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-slate-900 group-hover:ring-blue-500/20 transition-all">
            {session?.user?.image ? (
              <img src={session.user.image} alt={name} className="h-full w-full object-cover" />
            ) : (
              initials || <User className="h-5 w-5" />
            )}
          </div>
        </motion.div>
      </div>
    </header>
  );
}