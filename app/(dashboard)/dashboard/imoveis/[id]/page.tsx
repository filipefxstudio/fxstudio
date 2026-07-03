import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ImovelDetalhes } from "@/components/imoveis/ImovelDetalhes";
import { getImovelById, getStatusImovelList } from "@/lib/actions/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

interface ImovelDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ImovelDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const imovel = await getImovelById(id);

  return {
    title: imovel?.titulo
      ? `${imovel.titulo} | FX Studio`
      : "Detalhes do imóvel | FX Studio",
    description: "Visualize os detalhes do imóvel",
  };
}

export default async function ImovelDetailPage({ params }: ImovelDetailPageProps) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const { id } = await params;
  const [imovel, statusList] = await Promise.all([
    getImovelById(id),
    getStatusImovelList(corretor.id),
  ]);

  if (!imovel) {
    notFound();
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <ImovelDetalhes
        imovel={imovel}
        corretorSlug={corretor.slug}
        statusList={statusList}
      />
    </div>
  );
}
