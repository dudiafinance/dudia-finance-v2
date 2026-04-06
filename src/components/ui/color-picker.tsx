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
              "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
              value === color ? "border-slate-800 scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check className="h-4 w-4 text-white mx-auto" strokeWidth={3} />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-full border-2 border-slate-200"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-20 cursor-pointer rounded border border-slate-200 bg-transparent px-1 text-xs"
        />
        <span className="text-xs text-slate-500 font-mono">{value}</span>
      </div>
    </div>
  );
}
