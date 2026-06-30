import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientesListing } from "@/components/clientes/ClientesListing";
import { Header } from "@/components/dashboard/Header";
import { getClientes } from "@/lib/actions/clientes";
import { getPerfisEquipe } from "@/lib/actions/configuracoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Clientes | FX Studio",
  description: "Gerencie clientes, leads e proprietários",
};

export default async function ClientesPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const [clientes, perfis] = await Promise.all([getClientes(), getPerfisEquipe()]);

  return (
    <>
      <Header nome={corretor.nome} />
      <div className="flex-1 p-4 md:p-6">
        <ClientesListing clientes={clientes} perfis={perfis} />
      </div>
    </>
  );
}
