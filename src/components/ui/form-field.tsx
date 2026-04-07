import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, required, children, className }: FieldProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-2", className)}
    >
      <label className="block text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative group">
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 font-medium mt-1 ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 shadow-sm"
          : "border-slate-200 dark:border-slate-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 shadow-sm"
          : "border-slate-200 dark:border-slate-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 shadow-sm",
        className
      )}
      rows={3}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 shadow-sm"
          : "border-slate-200 dark:border-slate-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-5", className)}>
      {children}
    </div>
  );
}

export function FormDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
    </div>
  );
}