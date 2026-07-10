import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ImoveisListing } from "@/components/imoveis/ImoveisListing";
import { getImoveis, getStatusImovelList } from "@/lib/actions/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Imóveis | FX Studio",
  description: "Gerencie os imóveis do seu portfólio",
};

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialBusca = typeof params.busca === "string" ? params.busca : "";
  const initialBairro = typeof params.bairro === "string" ? params.bairro : "";

  const [imoveis, statusList] = await Promise.all([
    getImoveis(),
    getStatusImovelList(corretor.id),
  ]);

  return (
    <div className="flex-1 p-4 md:p-6">
      <ImoveisListing
        imoveis={imoveis}
        corretorSlug={corretor.slug}
        statusList={statusList}
        initialBusca={initialBusca}
        initialBairro={initialBairro}
      />
    </div>
  );
}
