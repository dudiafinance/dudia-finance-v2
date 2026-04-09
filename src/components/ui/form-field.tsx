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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-1.5", className)}
    >
      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-0.5">
        {label}
        {required && <span className="ml-1 text-destructive font-bold">*</span>}
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
            className="text-[10px] font-bold text-destructive uppercase mt-1.5 ml-0.5 tracking-wider"
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
        "h-10 w-full rounded-md border bg-secondary/30 px-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50",
        error
          ? "border-destructive/50 focus:border-destructive shadow-precision"
          : "border-border/50 focus:border-foreground focus:bg-background shadow-precision",
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
        "w-full rounded-md border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 resize-none",
        error
          ? "border-destructive/50 focus:border-destructive shadow-precision"
          : "border-border/50 focus:border-foreground focus:bg-background shadow-precision",
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
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full rounded-md border bg-secondary/30 px-3 text-sm text-foreground outline-none transition-all cursor-pointer appearance-none",
          error
            ? "border-destructive/50 focus:border-destructive shadow-precision"
            : "border-border/50 focus:border-foreground focus:bg-background shadow-precision",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6", className)}>
      {children}
    </div>
  );
}

export function FormDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-8">
      <div className="flex-1 h-px bg-border/40" />
      {label && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">{label}</span>}
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}