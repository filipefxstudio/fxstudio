import type { ProvedorIA } from "@/types";

export const MODELOS_POR_PROVEDOR: Record<ProvedorIA, readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o"],
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
} as const;

export const MODELO_PADRAO_POR_PROVEDOR: Record<ProvedorIA, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-1.5-flash",
};

export const API_KEY_MASK = "••••••••";
