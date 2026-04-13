"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/20",
    iconText: "text-red-500",
    confirmBtn: "bg-red-500 hover:bg-red-600 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
    iconText: "text-amber-500",
    confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  default: {
    icon: AlertTriangle,
    iconBg: "bg-foreground/10",
    iconBorder: "border-foreground/20",
    iconText: "text-foreground",
    confirmBtn: "bg-foreground hover:bg-foreground/90 text-background",
  },
};

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: AlertDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative w-full max-w-sm bg-background shadow-precision border border-border/50 rounded-lg overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6 p-8 text-center">
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center border",
                style.iconBg,
                style.iconBorder,
                style.iconText
              )}>
                <Icon className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-muted-foreground leading-relaxed px-2">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground h-12"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 text-[11px] font-bold uppercase tracking-widest h-12 transition-all",
                    style.confirmBtn
                  )}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
