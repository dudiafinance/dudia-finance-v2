"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeClass({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}