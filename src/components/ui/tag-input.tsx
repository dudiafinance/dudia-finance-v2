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
  value,
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

  const filteredSuggestions = suggestions.filter(
    (s) => !value.includes(s) && (input === "" || s.includes(input.toLowerCase()))
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex min-h-[40px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 transition-colors focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500",
          className
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
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
            // Delay to allow suggestion click to register
            setTimeout(() => {
              if (input) addTag(input);
              setShowSuggestions(false);
            }, 150);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
          <div className="p-1">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="text-emerald-500">#</span>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
