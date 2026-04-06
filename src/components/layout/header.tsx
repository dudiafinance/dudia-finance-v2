"use client";

import { Bell, Search, User } from "lucide-react";
import { mockUser } from "@/lib/mock-data";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{mockUser.name}</p>
            <p className="text-xs text-slate-500">{mockUser.email}</p>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
