"use client";

import { AtendimentoDadosTab } from "@/components/atendimentos/AtendimentoDadosTab";
import type { Lead } from "@/types";

interface DadosTabProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
}

export function DadosTab({ lead, perfis }: DadosTabProps) {
  return <AtendimentoDadosTab lead={lead} perfis={perfis} />;
}
