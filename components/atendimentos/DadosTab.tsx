"use client";

import { LeadDadosForm } from "@/components/leads/LeadDadosForm";
import type { Imovel, Lead } from "@/types";

interface DadosTabProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  imoveisIndicados: Imovel[];
}

export function DadosTab({ lead, perfis, imoveisIndicados }: DadosTabProps) {
  return <LeadDadosForm lead={lead} perfis={perfis} imoveisIndicados={imoveisIndicados} />;
}
