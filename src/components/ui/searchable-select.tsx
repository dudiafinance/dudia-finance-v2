"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchableSelectProps {
  options: { value: string; label: string; color?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhuma opção encontrada.",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center justify-between h-10 px-3 w-full rounded-md border bg-secondary/30 text-sm font-bold uppercase tracking-wider transition-all focus:outline-none focus:border-foreground border-border/50 hover:bg-secondary/50 shadow-precision text-left",
          !value && "text-muted-foreground font-medium",
          className
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.color && (
            <div 
              className="h-2 w-2 rounded-full shrink-0 border border-white/10 shadow-sm" 
              style={{ backgroundColor: selectedOption.color }} 
            />
          )}
          <span className="truncate text-[11px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value ? (
            <div
              className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </div>
          ) : (
            <ChevronDown className="h-4 w-4 opacity-30" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-border/50 shadow-precision" align="start">
        <div className="flex flex-col h-full max-h-[300px] bg-background">
          <div className="flex items-center border-b border-border/50 px-3 h-10">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full bg-transparent py-3 text-[11px] font-bold uppercase tracking-widest outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {filteredOptions.length === 0 && (
                <div className="py-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {emptyText}
                </div>
              )}
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-secondary",
                    value === option.value && "bg-secondary text-foreground"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 truncate">
                    {option.color && (
                      <div 
                        className="h-2 w-2 rounded-full shrink-0 border border-white/5 shadow-sm" 
                        style={{ backgroundColor: option.color }} 
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {value === option.value && (
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
