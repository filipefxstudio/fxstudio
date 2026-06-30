import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LeadsPage } from "@/components/leads/LeadsPage";
import { Header } from "@/components/dashboard/Header";
import type { LeadsFilterState } from "@/components/leads/LeadsFilters";
import {
  getLeads,
  getMidiasOrigem,
  getPerfisForLeads,
} from "@/lib/actions/leads";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import type { EtapaLead, TemperaturaLead } from "@/types";
import { isEtapaLead } from "@/lib/constants/leads";

export const metadata: Metadata = {
  title: "Leads | FX Studio",
  description: "Gestão de leads do corretor",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseInitialFilters(
  params: Record<string, string | string[] | undefined>,
): Partial<LeadsFilterState> {
  const filters: Partial<LeadsFilterState> = {};

  const etapa = typeof params.etapa === "string" ? params.etapa : undefined;
  if (etapa && isEtapaLead(etapa)) {
    filters.etapa = etapa as EtapaLead;
  }

  const temperatura =
    typeof params.temperatura === "string" ? params.temperatura : undefined;
  if (temperatura === "quente" || temperatura === "morno" || temperatura === "frio") {
    filters.temperatura = temperatura as TemperaturaLead;
  }

  const finalidade =
    typeof params.finalidade === "string" ? params.finalidade : undefined;
  if (finalidade === "compra" || finalidade === "locacao") {
    filters.finalidade = finalidade;
  }

  const semInteracao =
    typeof params.sem_interacao === "string" ? Number(params.sem_interacao) : undefined;
  if (semInteracao && !Number.isNaN(semInteracao)) {
    filters.semInteracaoDias = semInteracao;
  }

  return filters;
}

export default async function LeadsRoutePage({ searchParams }: PageProps) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialFilters = parseInitialFilters(params);

  const [leads, midias, perfis] = await Promise.all([
    getLeads({ ativos_apenas: false }),
    getMidiasOrigem(),
    getPerfisForLeads(),
  ]);

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 p-4 md:p-6">
        <LeadsPage
          initialLeads={leads}
          corretorId={corretor.id}
          midias={midias}
          perfis={perfis}
          initialFilters={initialFilters}
        />
      </div>
    </>
  );
}
