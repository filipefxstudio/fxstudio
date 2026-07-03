"use client";

import { Suspense } from "react";

import { AtendimentoHeader } from "@/components/atendimentos/AtendimentoHeader";
import { AtendimentoTabs } from "@/components/atendimentos/AtendimentoTabs";
import { AuditoriaTab } from "@/components/atendimentos/AuditoriaTab";
import { DadosTab } from "@/components/atendimentos/DadosTab";
import { DocumentosTab } from "@/components/atendimentos/DocumentosTab";
import { ImoveisIndicadosTab } from "@/components/atendimentos/ImoveisIndicadosTab";
import { ImoveisSelecionadosTab } from "@/components/atendimentos/ImoveisSelecionadosTab";
import { NegocioTab } from "@/components/atendimentos/NegocioTab";
import { PropostasTab } from "@/components/atendimentos/PropostasTab";
import { VisitasTab } from "@/components/atendimentos/VisitasTab";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import type {
  AuditoriaAtendimento,
  Imovel,
  Lead,
  LeadImovelSelecionado,
  Negocio,
  Proposta,
  Visita,
} from "@/types";

interface AtendimentoClientProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  imoveisMap: Record<string, Imovel>;
  visitas: Visita[];
  propostas: Proposta[];
  negocios: Negocio[];
  imoveisSelecionados: LeadImovelSelecionado[];
  auditoria: AuditoriaAtendimento[];
}

export function AtendimentoClient({
  lead,
  perfis,
  imoveisMap,
  visitas,
  propostas,
  negocios,
  imoveisSelecionados,
  auditoria,
}: AtendimentoClientProps) {
  const { meta } = parseLeadObservacoes(lead.observacoes);
  const indicadosIds = new Set<string>();
  if (lead.imovel_id) indicadosIds.add(lead.imovel_id);
  for (const id of meta.imoveis_indicados ?? []) indicadosIds.add(id);

  const imoveisIndicados = Array.from(indicadosIds)
    .map((id) => imoveisMap[id])
    .filter((i): i is Imovel => Boolean(i));

  const imoveisParaAcao =
    imoveisIndicados.length > 0
      ? imoveisIndicados
      : Object.values(imoveisMap);

  return (
    <div className="space-y-4">
      <AtendimentoHeader lead={lead} />

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <AtendimentoTabs
          panels={{
            dados: (
              <DadosTab lead={lead} perfis={perfis} imoveisIndicados={imoveisIndicados} />
            ),
            indicados: (
              <ImoveisIndicadosTab lead={lead} imoveis={imoveisIndicados} />
            ),
            selecionados: (
              <ImoveisSelecionadosTab
                leadId={lead.id}
                imoveisIndicados={imoveisIndicados}
                selecionados={imoveisSelecionados}
              />
            ),
            visitas: (
              <VisitasTab leadId={lead.id} visitas={visitas} imoveis={imoveisParaAcao} />
            ),
            propostas: (
              <PropostasTab
                leadId={lead.id}
                propostas={propostas}
                imoveis={imoveisParaAcao}
              />
            ),
            negocio: (
              <NegocioTab
                leadId={lead.id}
                negocios={negocios}
                propostas={propostas}
                imoveis={imoveisParaAcao}
              />
            ),
            auditoria: <AuditoriaTab registros={auditoria} />,
            documentos: <DocumentosTab />,
          }}
        />
      </Suspense>
    </div>
  );
}
