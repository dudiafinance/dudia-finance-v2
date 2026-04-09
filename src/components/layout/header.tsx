"use client";

import Image from "next/image";
import { Search, User, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMobileNav } from "./mobile-nav-context";
import { NotificationBell } from "./notification-bell";
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-md transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary border border-transparent hover:border-border transition-all lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative hidden lg:block group">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-64 rounded-md border border-border bg-secondary/50 pl-9 pr-4 text-[13px] font-medium outline-none transition-all focus:border-foreground/30 focus:bg-background dark:placeholder-zinc-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <NotificationBell />

        <div className="h-4 w-px bg-border hidden md:block" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="hidden text-right lg:block">
            <p className="text-[12px] font-bold text-foreground leading-tight transition-colors uppercase tracking-tight">{name}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{email ? email.split('@')[0] : 'Usuário'}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background text-[11px] font-bold select-none overflow-hidden border border-border">
            {session?.user?.image ? (
              <Image 
                src={session.user.image} 
                alt={name} 
                width={32} 
                height={32} 
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              initials || <User className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}