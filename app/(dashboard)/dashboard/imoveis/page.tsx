import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Header } from "@/components/dashboard/Header";
import { ImoveisListing } from "@/components/imoveis/ImoveisListing";
import { getImoveis } from "@/lib/actions/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Imóveis | FX Studio",
  description: "Gerencie os imóveis do seu portfólio",
};

export default async function ImoveisPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const imoveis = await getImoveis();

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 p-4 md:p-6">
        <ImoveisListing imoveis={imoveis} />
      </div>
    </>
  );
}
