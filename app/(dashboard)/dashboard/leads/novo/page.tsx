import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Header } from "@/components/dashboard/Header";
import { NovoLeadForm } from "@/components/leads/NovoLeadForm";
import { getMidiasOrigem, getPerfisForLeads } from "@/lib/actions/leads";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Novo lead | FX Studio",
  description: "Cadastrar novo lead",
};

export default async function NovoLeadPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const [midias, perfis] = await Promise.all([getMidiasOrigem(), getPerfisForLeads()]);

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
        <NovoLeadForm midias={midias} perfis={perfis} />
      </div>
    </>
  );
}
