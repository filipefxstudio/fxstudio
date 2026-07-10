"use client";

import { Suspense } from "react";

import { AtendimentoHeader } from "@/components/atendimentos/AtendimentoHeader";
import { AtendimentoTabs } from "@/components/atendimentos/AtendimentoTabs";
import { AtendimentoDadosTab } from "@/components/atendimentos/AtendimentoDadosTab";
import { AuditoriaTab } from "@/components/atendimentos/AuditoriaTab";
import { ImoveisSelecionadosTab } from "@/components/atendimentos/ImoveisSelecionadosTab";
import { NegocioTab } from "@/components/atendimentos/NegocioTab";
import { PropostasTab } from "@/components/atendimentos/PropostasTab";
import { RadarImoveisTab } from "@/components/atendimentos/RadarImoveisTab";
import { VisitasTab } from "@/components/atendimentos/VisitasTab";
import type {
  AuditoriaAtendimento,
  Imovel,
  Lead,
  LeadImovelSelecionado,
  MotivoDescarte,
  Negocio,
  Proposta,
  Visita,
} from "@/types";

interface AtendimentoClientProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  imoveisRadar: Imovel[];
  visitas: Visita[];
  propostas: Proposta[];
  negocios: Negocio[];
  imoveisSelecionados: LeadImovelSelecionado[];
  auditoria: AuditoriaAtendimento[];
  motivos: MotivoDescarte[];
  podeTransferir: boolean;
}

export function AtendimentoClient({
  lead,
  perfis,
  imoveisRadar,
  visitas,
  propostas,
  negocios,
  imoveisSelecionados,
  auditoria,
  motivos,
  podeTransferir,
}: AtendimentoClientProps) {
  const imoveisParaAcao = imoveisSelecionados
    .map((s) => s.imovel)
    .filter((i): i is Imovel => Boolean(i));

  return (
    <div className="space-y-4">
      <AtendimentoHeader
        lead={lead}
        perfis={perfis}
        motivos={motivos}
        podeTransferir={podeTransferir}
      />

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <AtendimentoTabs
          panels={{
            dados: <AtendimentoDadosTab lead={lead} perfis={perfis} />,
            radar: (
              <RadarImoveisTab
                leadId={lead.id}
                imoveis={imoveisRadar}
                selecionados={imoveisSelecionados}
                imovelInteresseId={lead.imovel_id}
              />
            ),
            selecionados: (
              <ImoveisSelecionadosTab
                leadId={lead.id}
                selecionados={imoveisSelecionados}
                imovelInteresseId={lead.imovel_id}
              />
            ),
            visitas: (
              <VisitasTab
                leadId={lead.id}
                visitas={visitas}
                imoveis={imoveisParaAcao.length > 0 ? imoveisParaAcao : imoveisRadar}
              />
            ),
            propostas: (
              <PropostasTab
                leadId={lead.id}
                propostas={propostas}
                imoveis={imoveisParaAcao.length > 0 ? imoveisParaAcao : imoveisRadar}
              />
            ),
            negocio: <NegocioTab negocios={negocios} />,
            auditoria: <AuditoriaTab registros={auditoria} />,
          }}
        />
      </Suspense>
    </div>
  );
}
