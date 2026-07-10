"use client";

import { AtendimentoDadosTab } from "@/components/atendimentos/AtendimentoDadosTab";
import type { Lead, TipoImovelCustom } from "@/types";

interface DadosTabProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  tiposImovel: TipoImovelCustom[];
}

export function DadosTab({ lead, perfis, tiposImovel }: DadosTabProps) {
  return <AtendimentoDadosTab lead={lead} perfis={perfis} tiposImovel={tiposImovel} />;
}
