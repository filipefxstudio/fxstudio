import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AtendimentoClient } from "@/components/atendimentos/AtendimentoClient";
import { getAtendimentoCompleto } from "@/lib/actions/atendimentos";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { Imovel } from "@/types";

export const metadata: Metadata = {
  title: "Atendimento | FX Studio",
  description: "Detalhes do atendimento",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const { id } = await params;
  const data = await getAtendimentoCompleto(id);

  if (!data) {
    notFound();
  }

  const { lead, visitas, propostas, negocios, imoveisSelecionados, auditoria } = data;
  const { meta } = parseLeadObservacoes(lead.observacoes);
  const imovelIds = new Set<string>();
  if (lead.imovel_id) imovelIds.add(lead.imovel_id);
  for (const imovelId of meta.imoveis_indicados ?? []) imovelIds.add(imovelId);
  for (const v of visitas) if (v.imovel_id) imovelIds.add(v.imovel_id);
  for (const s of imoveisSelecionados) imovelIds.add(s.imovel_id);

  let imoveisMap: Record<string, Imovel> = {};

  if (imovelIds.size > 0) {
    const supabase = await createClient();
    const { data: imoveisData } = await supabase
      .from("imoveis")
      .select("*, fotos:imovel_fotos(*)")
      .eq("corretor_id", corretor.id)
      .in("id", Array.from(imovelIds));

    imoveisMap = Object.fromEntries(
      ((imoveisData ?? []) as Imovel[]).map((imovel) => [imovel.id, imovel]),
    );
  }

  const perfis = await import("@/lib/actions/leads").then((m) => m.getPerfisForLeads());

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <Link
        href="/dashboard/atendimentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="size-4" />
        Voltar para atendimentos
      </Link>

      <AtendimentoClient
        lead={lead}
        perfis={perfis}
        imoveisMap={imoveisMap}
        visitas={visitas}
        propostas={propostas}
        negocios={negocios}
        imoveisSelecionados={imoveisSelecionados}
        auditoria={auditoria}
      />
    </div>
  );
}
