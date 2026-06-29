import Link from "next/link";

import { HeroBusca } from "@/components/site/HeroBusca";
import { ImovelCardPublico } from "@/components/site/ImovelCardPublico";
import { Button } from "@/components/ui/button";
import { resolveSiteBasePath, sitePath } from "@/lib/site/paths";
import { getBairrosPublicos, getCorretorByDominio, getImoveisPublicos } from "@/lib/site/queries";

interface CustomHomePageProps {
  params: Promise<{ hostname: string }>;
}

export default async function CustomHomePage({ params }: CustomHomePageProps) {
  const { hostname } = await params;
  const decodedHostname = decodeURIComponent(hostname);
  const corretor = await getCorretorByDominio(decodedHostname);

  if (!corretor) {
    return null;
  }

  const basePath = await resolveSiteBasePath({
    tenantSlug: corretor.slug,
    routeKind: "custom",
    hostname: decodedHostname,
  });
  const [imoveis, bairros] = await Promise.all([
    getImoveisPublicos(corretor.id),
    getBairrosPublicos(corretor.id),
  ]);
  const destaques = imoveis.slice(0, 6);

  return (
    <>
      <HeroBusca corretor={corretor} basePath={basePath} bairros={bairros} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Imóveis em destaque</h2>
            <p className="mt-2 text-muted-foreground">
              Oportunidades selecionadas para compra e locação.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={sitePath(basePath, "/imoveis")}>Ver todos</Link>
          </Button>
        </div>

        {destaques.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((imovel) => (
              <ImovelCardPublico key={imovel.id} imovel={imovel} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nenhum imóvel publicado no momento.
          </div>
        )}
      </section>
    </>
  );
}
