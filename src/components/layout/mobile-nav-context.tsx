"use client";
import { createContext, useContext, useState } from "react";

const MobileNavContext = createContext({ open: false, setOpen: (_: boolean) => {} });

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export const useMobileNav = () => useContext(MobileNavContext);
