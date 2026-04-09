"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Adicionar tag...",
  suggestions = [],
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const safeValue = Array.isArray(value) ? value : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

  const filteredSuggestions = safeSuggestions.filter(
    (s) => typeof s === "string" && !safeValue.includes(s) && (input === "" || s.toLowerCase().includes(input.toLowerCase()))
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex min-h-[40px] w-full flex-wrap items-center gap-2 rounded-md border border-border/50 bg-secondary/30 px-3 py-2 transition-all focus-within:border-foreground focus-within:bg-background shadow-precision",
          className
        )}
      >
        {(value || []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded bg-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-background shadow-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-background/60 hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={onKey}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => {
              if (input) addTag(input);
              setShowSuggestions(false);
            }, 150);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 bg-transparent text-[11px] font-bold uppercase tracking-widest text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-md border border-border/50 bg-background shadow-precision">
          <div className="p-1">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <span className="text-foreground/40">#</span>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}