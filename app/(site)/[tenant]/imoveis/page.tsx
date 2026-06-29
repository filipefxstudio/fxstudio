import type { Metadata } from "next";

import { FiltrosBusca } from "@/components/site/FiltrosBusca";
import { ImovelCardPublico } from "@/components/site/ImovelCardPublico";
import { parseImoveisSearchParams } from "@/lib/site/paths";
import {
  getBairrosPublicos,
  getCorretorBySlug,
  getImoveisPublicos,
} from "@/lib/site/queries";

interface ImoveisListingPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ImoveisListingPageProps): Promise<Metadata> {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);

  return {
    title: corretor ? `Imóveis | ${corretor.nome}` : "Imóveis",
    description: "Busque apartamentos, casas e oportunidades disponíveis.",
  };
}

export default async function ImoveisListingPage({
  params,
  searchParams,
}: ImoveisListingPageProps) {
  const { tenant } = await params;
  const query = await searchParams;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    return null;
  }

  const filters = parseImoveisSearchParams(query);
  const [imoveis, bairros] = await Promise.all([
    getImoveisPublicos(corretor.id, filters),
    getBairrosPublicos(corretor.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Imóveis disponíveis</h1>
        <p className="mt-2 text-muted-foreground">
          {imoveis.length} {imoveis.length === 1 ? "resultado" : "resultados"} encontrados
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <FiltrosBusca bairros={bairros} initialValues={filters} layout="sidebar" />
        </aside>

        <div>
          {imoveis.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {imoveis.map((imovel) => (
                <ImovelCardPublico key={imovel.id} imovel={imovel} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Nenhum imóvel encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
