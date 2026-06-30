"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InteracaoForm } from "@/components/leads/InteracaoForm";
import { LeadDadosForm } from "@/components/leads/LeadDadosForm";
import { LeadHistorico } from "@/components/leads/LeadHistorico";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import type { Imovel, Lead } from "@/types";

interface LeadAtendimentoProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  imoveisMap: Record<string, Imovel>;
}

export function LeadAtendimento({ lead, perfis, imoveisMap }: LeadAtendimentoProps) {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<"dados" | "historico">("dados");

  const { meta } = parseLeadObservacoes(lead.observacoes);
  const indicadosIds = new Set<string>();
  if (lead.imovel_id) indicadosIds.add(lead.imovel_id);
  for (const id of meta.imoveis_indicados ?? []) {
    indicadosIds.add(id);
  }
  const imoveisIndicados = Array.from(indicadosIds)
    .map((id) => imoveisMap[id])
    .filter((i): i is Imovel => Boolean(i));

  const interacoes = lead.interacoes ?? [];

  const dadosPanel = (
    <LeadDadosForm lead={lead} perfis={perfis} imoveisIndicados={imoveisIndicados} />
  );

  const historicoPanel = (
    <div className="space-y-6">
      <InteracaoForm leadId={lead.id} onSuccess={() => router.refresh()} />
      <div>
        <h3 className="mb-4 font-semibold text-primary">Histórico</h3>
        <LeadHistorico interacoes={interacoes} />
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "dados" | "historico")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="mt-4">
            {dadosPanel}
          </TabsContent>
          <TabsContent value="historico" className="mt-4">
            {historicoPanel}
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden gap-6 md:grid md:grid-cols-2">
        <div>{dadosPanel}</div>
        <div>{historicoPanel}</div>
      </div>
    </>
  );
}
