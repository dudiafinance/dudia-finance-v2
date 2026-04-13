"use client";

import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterPaid: string;
  onFilterPaidChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterPaid,
  onFilterPaidChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
}: TransactionFiltersProps) {
  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative group flex-1 w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <Input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 text-[13px] bg-secondary/30 border-border focus:bg-background shadow-precision"
          />
        </div>

        <div className="flex gap-1 rounded-lg bg-secondary p-1 border border-border shadow-precision">
          {[
            { key: "all", label: "Geral" },
            { key: "income", label: "Entradas" },
            { key: "expense", label: "Saídas" },
            { key: "transfer", label: "Transf." },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filterType === key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onFilterTypeChange(key)}
              className={cn(
                "h-7 px-4 transition-all rounded text-[11px] font-bold uppercase",
                filterType === key ? "bg-background text-foreground shadow-precision border-precision border-border/50" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={onToggleFilters}
          className={cn("gap-2 h-10 border-border shadow-precision text-[11px] font-bold uppercase",
            showFilters && "bg-secondary"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros</span>
        </Button>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: "auto", opacity: 1 }} 
          className="mb-8 overflow-hidden"
        >
          <div className="bg-secondary/20 rounded-lg border border-border/50 p-5 flex flex-wrap gap-6 shadow-precision">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Liquidação</p>
              <div className="flex gap-2">
                {[{ key: "all", label: "Todos" }, { key: "paid", label: "Confirmados" }, { key: "pending", label: "Pendentes" }].map(({ key, label }) => (
                  <Button 
                    key={key} 
                    size="sm"
                    variant={filterPaid === key ? "default" : "outline"}
                    onClick={() => onFilterPaidChange(key)}
                    className={cn("h-8 px-4 text-[10px] font-bold uppercase rounded border-border transition-all",
                      filterPaid === key ? "shadow-precision" : "bg-background hover:bg-secondary"
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] flex items-end justify-end">
              <Button 
                variant="ghost"
                size="sm"
                onClick={onClearFilters} 
                className="text-muted-foreground hover:text-red-500 gap-2 font-bold uppercase text-[10px]"
              >
                <X className="h-3.5 w-3.5" /> Limpar Filtros
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
