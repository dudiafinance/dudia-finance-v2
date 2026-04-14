"use client";

import { Bell, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useNotifications, useUpdateNotifications } from "@/hooks/use-api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-rose-500" />,
};

const typeColors = {
  info: "bg-blue-50 dark:bg-blue-900/20",
  success: "bg-emerald-50 dark:bg-emerald-900/20",
  warning: "bg-amber-50 dark:bg-amber-900/20",
  error: "bg-rose-50 dark:bg-rose-900/20",
};

export function NotificationBell() {
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const { mutate: updateNotifications } = useUpdateNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      updateNotifications({ markAllAsRead: true });
    }
  };

  const handleMarkAsRead = (id: string) => {
    updateNotifications({ id });
  };

  return (
    <Popover>
      <PopoverTrigger className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
        <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-tada")} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notificações</h4>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <Separator className="mt-2" />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
              <Bell className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    !n.isRead && "bg-slate-50/50 dark:bg-slate-800/30"
                  )}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className={cn("mt-1 rounded-full p-1.5", typeColors[n.type as keyof typeof typeColors])}>
                      {typeIcons[n.type as keyof typeof typeIcons] || typeIcons.info}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-none", !n.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
            <button className="w-full rounded-md py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all">
                Ver todo o histórico
            </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
