"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeScript() {
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, [setTheme, theme]);

  return null;
}