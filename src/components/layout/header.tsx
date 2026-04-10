"use client";

import { Search, Menu } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMobileNav } from "./mobile-nav-context";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { user } = useUser();
  const { setOpen } = useMobileNav();
  const name = user?.fullName ?? user?.username ?? "Usuário";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

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

        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="hidden text-right lg:block">
            <p className="text-[12px] font-bold text-foreground leading-tight transition-colors uppercase tracking-tight">{name}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{email ? email.split('@')[0] : 'Terminal'}</p>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-md border border-border shadow-precision",
                userButtonPopoverCard: "bg-background border border-border/50 shadow-precision rounded-lg",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}