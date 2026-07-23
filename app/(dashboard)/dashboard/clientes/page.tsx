import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientesListing } from "@/components/clientes/ClientesListing";
import { getClientes } from "@/lib/actions/clientes";
import { getPerfisEquipe } from "@/lib/actions/configuracoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Pessoas | Deskimob",
  description: "Gerencie leads e proprietários cadastrados no CRM",
};

export default async function ClientesPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const [clientes, perfis] = await Promise.all([getClientes(), getPerfisEquipe()]);

  return (
    <div className="flex-1 p-4 md:p-6">
      <ClientesListing clientes={clientes} perfis={perfis} />
    </div>
  );
}
