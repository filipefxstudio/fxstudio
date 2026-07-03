"use client";

import { createContext, useContext } from "react";

import type { Corretor } from "@/types";

import { sitePath } from "@/lib/site/paths";

interface SiteContextValue {
  corretor: Corretor;
  basePath: string;
  link: (path: string) => string;
  hasImoveisLocacao: boolean;
}

const SiteContext = createContext<SiteContextValue | null>(null);

interface SiteProviderProps {
  corretor: Corretor;
  basePath: string;
  hasImoveisLocacao?: boolean;
  children: React.ReactNode;
}

export function SiteProvider({
  corretor,
  basePath,
  hasImoveisLocacao = false,
  children,
}: SiteProviderProps) {
  const value: SiteContextValue = {
    corretor,
    basePath,
    hasImoveisLocacao,
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
