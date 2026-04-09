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
          "inline-flex items-center justify-between h-11 px-3 w-full rounded-xl border bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 text-sm font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm text-left",
          !value && "text-slate-400 font-normal",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <div 
              className="h-2 w-2 rounded-full shrink-0" 
              style={{ backgroundColor: selectedOption.color }} 
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value ? (
            <div
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
            </div>
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col h-full max-h-[300px]">
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 h-10">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {filteredOptions.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-500">
                  {emptyText}
                </div>
              )}
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                    value === option.value && "bg-slate-100 dark:bg-slate-800 font-medium"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 truncate">
                    {option.color && (
                      <div 
                        className="h-2.5 w-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: option.color }} 
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />
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
