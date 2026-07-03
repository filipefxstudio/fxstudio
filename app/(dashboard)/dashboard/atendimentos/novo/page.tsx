import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { NovoLeadForm } from "@/components/leads/NovoLeadForm";
import { getMidiasOrigem, getPerfisForLeads } from "@/lib/actions/leads";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Novo atendimento | FX Studio",
  description: "Cadastrar novo atendimento",
};

export default async function NovoAtendimentoPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const [midias, perfis] = await Promise.all([getMidiasOrigem(), getPerfisForLeads()]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <Link
        href="/dashboard/atendimentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="size-4" />
        Voltar para atendimentos
      </Link>
      <NovoLeadForm midias={midias} perfis={perfis} />
    </div>
  );
}
