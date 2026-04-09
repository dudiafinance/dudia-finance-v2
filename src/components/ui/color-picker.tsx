"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const PRESET_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#14B8A6", "#6366F1", "#84CC16", "#F97316",
  "#06B6D4", "#A855F7", "#E11D48", "#0EA5E9", "#22C55E",
  "#64748B", "#820AD1", "#EC7000", "#1A1A1A", "#DC2626",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-all hover:scale-110 shadow-precision",
              value === color ? "border-foreground scale-110 shadow-lg ring-2 ring-background ring-offset-1" : "border-transparent opacity-60 hover:opacity-100"
            )}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check className="h-3.5 w-3.5 text-white mx-auto drop-shadow-sm" strokeWidth={4} />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 p-2 bg-secondary/30 rounded-lg border border-border/50 shadow-precision w-fit">
        <div
          className="h-6 w-6 shrink-0 rounded-full border border-white/10 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <div className="flex items-center gap-2 border-l border-border/50 pl-4">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-10 cursor-pointer rounded bg-transparent border-0 p-0"
          />
          <span className="text-[10px] text-muted-foreground font-bold tabular-nums tracking-widest uppercase">{value}</span>
        </div>
      </div>
    </div>
  );
}
