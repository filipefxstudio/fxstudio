"use client";

import { AtendimentoDadosTab } from "@/components/atendimentos/AtendimentoDadosTab";
import type { Lead, MotivoDescarte, TipoImovelCustom } from "@/types";

interface DadosTabProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  tiposImovel: TipoImovelCustom[];
  motivos: MotivoDescarte[];
}

export function DadosTab({ lead, perfis, tiposImovel, motivos }: DadosTabProps) {
  return (
    <AtendimentoDadosTab
      lead={lead}
      perfis={perfis}
      tiposImovel={tiposImovel}
      motivos={motivos}
    />
  );
}
