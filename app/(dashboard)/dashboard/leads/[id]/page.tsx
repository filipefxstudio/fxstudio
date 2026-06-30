import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Header } from "@/components/dashboard/Header";
import { LeadAtendimento } from "@/components/leads/LeadAtendimento";
import { getLeadById, getPerfisForLeads } from "@/lib/actions/leads";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { Imovel } from "@/types";

export const metadata: Metadata = {
  title: "Atendimento | FX Studio",
  description: "Atendimento do lead",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadAtendimentoPage({ params }: PageProps) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const { id } = await params;
  const [lead, perfis] = await Promise.all([getLeadById(id), getPerfisForLeads()]);

  if (!lead) {
    notFound();
  }

  const { meta } = parseLeadObservacoes(lead.observacoes);
  const imovelIds = new Set<string>();
  if (lead.imovel_id) imovelIds.add(lead.imovel_id);
  for (const imovelId of meta.imoveis_indicados ?? []) {
    imovelIds.add(imovelId);
  }

  let imoveisMap: Record<string, Imovel> = {};

  if (imovelIds.size > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("imoveis")
      .select("id, titulo, codigo, bairro, finalidade, status")
      .eq("corretor_id", corretor.id)
      .in("id", Array.from(imovelIds));

    imoveisMap = Object.fromEntries(
      ((data ?? []) as Imovel[]).map((imovel) => [imovel.id, imovel]),
    );
  }

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 space-y-4 p-4 md:p-6">
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-4" />
          Voltar para leads
        </Link>

        <LeadAtendimento lead={lead} perfis={perfis} imoveisMap={imoveisMap} />
      </div>
    </>
  );
}
