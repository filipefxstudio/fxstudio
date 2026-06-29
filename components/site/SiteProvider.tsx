"use client";

import { createContext, useContext } from "react";

import type { Corretor } from "@/types";

import { sitePath } from "@/lib/site/paths";

interface SiteContextValue {
  corretor: Corretor;
  basePath: string;
  link: (path: string) => string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

interface SiteProviderProps {
  corretor: Corretor;
  basePath: string;
  children: React.ReactNode;
}

export function SiteProvider({ corretor, basePath, children }: SiteProviderProps) {
  const value: SiteContextValue = {
    corretor,
    basePath,
    link: (path: string) => sitePath(basePath, path),
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const context = useContext(SiteContext);

  if (!context) {
    throw new Error("useSite must be used within SiteProvider");
  }

  return context;
}
