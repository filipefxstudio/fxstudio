import { FiltrosBusca } from "@/components/site/FiltrosBusca";
import { ImovelCardPublico } from "@/components/site/ImovelCardPublico";
import type { ImoveisPublicosFilters } from "@/lib/site/queries";
import { getBairrosPublicos, getImoveisPublicos } from "@/lib/site/queries";
import type { Corretor, FinalidadeImovel } from "@/types";

interface SiteImoveisListingProps {
  corretor: Corretor;
  finalidade?: FinalidadeImovel;
  filters: ImoveisPublicosFilters;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
}

export async function SiteImoveisListing({
  corretor,
  finalidade,
  filters,
  title,
  subtitle,
  emptyMessage = "Nenhum imóvel encontrado com os filtros selecionados.",
}: SiteImoveisListingProps) {
  const mergedFilters: ImoveisPublicosFilters = {
    ...filters,
    finalidade: finalidade ?? filters.finalidade,
  };

  const [imoveis, bairros] = await Promise.all([
    getImoveisPublicos(corretor.id, mergedFilters),
    getBairrosPublicos(corretor.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            {imoveis.length} {imoveis.length === 1 ? "resultado" : "resultados"} encontrados
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <FiltrosBusca
            bairros={bairros}
            initialValues={mergedFilters}
            layout="sidebar"
            fixedFinalidade={finalidade}
          />
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
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
