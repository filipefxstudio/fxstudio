import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  Car,
  MapPin,
  Maximize2,
  MessageCircle,
} from "lucide-react";

import { ImovelGaleria } from "@/components/site/ImovelGaleria";
import { ImovelMapa } from "@/components/site/ImovelMapa";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatEndereco,
  getCapaUrl,
  getFinalidadeLabel,
  getTipoLabel,
  getValorExibicao,
} from "@/lib/site/format";
import { resolveSiteBasePath, sitePath } from "@/lib/site/paths";
import { getCorretorBySlug, getImovelPublico } from "@/lib/site/queries";
import { buildImovelWhatsAppUrl } from "@/lib/site/whatsapp";

interface ImovelDetailPageProps {
  params: Promise<{ tenant: string; slug: string }>;
}

function buildAbsoluteUrl(path: string): string {
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "fxstudio.com.br";
  return `https://${mainDomain}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({ params }: ImovelDetailPageProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    return { title: "Imóvel não encontrado" };
  }

  const imovel = await getImovelPublico(corretor.id, slug);

  if (!imovel) {
    return { title: "Imóvel não encontrado" };
  }

  const titulo = imovel.titulo ?? "Imóvel disponível";
  const descricao =
    imovel.descricao?.slice(0, 160) ??
    `${getTipoLabel(imovel.tipo)} para ${getFinalidadeLabel(imovel.finalidade).toLowerCase()} em ${imovel.bairro ?? imovel.cidade ?? "localização sob consulta"}.`;
  const imagem = getCapaUrl(imovel);
  const basePath = await resolveSiteBasePath({ tenantSlug: tenant, routeKind: "slug" });
  const pagePath = sitePath(basePath, `/imoveis/${slug}`);

  return {
    title: `${titulo} | ${corretor.nome}`,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      type: "website",
      images: imagem ? [{ url: imagem, alt: titulo }] : undefined,
    },
    twitter: {
      card: imagem ? "summary_large_image" : "summary",
      title: titulo,
      description: descricao,
      images: imagem ? [imagem] : undefined,
    },
    alternates: {
      canonical: pagePath,
    },
  };
}

export default async function ImovelDetailPage({ params }: ImovelDetailPageProps) {
  const { tenant, slug } = await params;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    notFound();
  }

  const imovel = await getImovelPublico(corretor.id, slug);

  if (!imovel) {
    notFound();
  }

  const basePath = await resolveSiteBasePath({ tenantSlug: tenant, routeKind: "slug" });
  const pagePath = sitePath(basePath, `/imoveis/${slug}`);
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const absolutePageUrl = host ? `${protocol}://${host}${pagePath}` : buildAbsoluteUrl(pagePath);
  const whatsappUrl = buildImovelWhatsAppUrl(corretor, imovel, absolutePageUrl);

  const endereco = formatEndereco(imovel);
  const preco =
    imovel.finalidade === "venda" ? imovel.valor_venda : imovel.valor_locacao;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: imovel.titulo ?? "Imóvel disponível",
    description: imovel.descricao ?? undefined,
    url: absolutePageUrl,
    image: getCapaUrl(imovel) ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: [imovel.logradouro, imovel.numero].filter(Boolean).join(", ") || undefined,
      addressLocality: imovel.cidade ?? undefined,
      addressRegion: imovel.estado ?? undefined,
      postalCode: imovel.cep ?? undefined,
      addressCountry: "BR",
    },
    geo:
      imovel.latitude && imovel.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: imovel.latitude,
            longitude: imovel.longitude,
          }
        : undefined,
    offers: preco
      ? {
          "@type": "Offer",
          price: String(preco),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href={sitePath(basePath, "/imoveis")} className="hover:text-primary">
            Imóveis
          </Link>
          <span className="mx-2">/</span>
          <span>{imovel.titulo ?? "Detalhes"}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <ImovelGaleria fotos={imovel.fotos ?? []} titulo={imovel.titulo ?? "Imóvel"} />

            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-accent">
                    {getFinalidadeLabel(imovel.finalidade)} · {getTipoLabel(imovel.tipo)}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-primary">
                    {imovel.titulo ?? "Imóvel disponível"}
                  </h1>
                  {endereco ? (
                    <p className="mt-3 inline-flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" />
                      {endereco}
                    </p>
                  ) : null}
                </div>
                <p className="text-2xl font-bold text-primary">{getValorExibicao(imovel)}</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {imovel.quartos > 0 ? (
                <div className="rounded-xl border border-border p-4 text-center">
                  <BedDouble className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-lg font-semibold">{imovel.quartos}</p>
                  <p className="text-xs text-muted-foreground">Quartos</p>
                </div>
              ) : null}
              {imovel.banheiros > 0 ? (
                <div className="rounded-xl border border-border p-4 text-center">
                  <Bath className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-lg font-semibold">{imovel.banheiros}</p>
                  <p className="text-xs text-muted-foreground">Banheiros</p>
                </div>
              ) : null}
              {imovel.vagas > 0 ? (
                <div className="rounded-xl border border-border p-4 text-center">
                  <Car className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-lg font-semibold">{imovel.vagas}</p>
                  <p className="text-xs text-muted-foreground">Vagas</p>
                </div>
              ) : null}
              {imovel.area_util ? (
                <div className="rounded-xl border border-border p-4 text-center">
                  <Maximize2 className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-lg font-semibold">{imovel.area_util} m²</p>
                  <p className="text-xs text-muted-foreground">Área útil</p>
                </div>
              ) : null}
            </section>

            {imovel.descricao ? (
              <section>
                <h2 className="text-xl font-semibold text-primary">Descrição</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {imovel.descricao}
                </p>
              </section>
            ) : null}

            {imovel.diferenciais && imovel.diferenciais.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-primary">Diferenciais</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {imovel.diferenciais.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-[#2D3748]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {imovel.latitude && imovel.longitude ? (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-primary">Localização</h2>
                <ImovelMapa
                  latitude={imovel.latitude}
                  longitude={imovel.longitude}
                  endereco={endereco}
                />
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-primary">Fale com o corretor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {corretor.nome}
              {corretor.creci ? ` · CRECI ${corretor.creci}` : ""}
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold text-primary">{getValorExibicao(imovel)}</span>
              </div>
              {imovel.valor_condominio ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Condomínio</span>
                  <span>{formatCurrency(imovel.valor_condominio)}</span>
                </div>
              ) : null}
              {imovel.valor_iptu ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">IPTU</span>
                  <span>{formatCurrency(imovel.valor_iptu)}</span>
                </div>
              ) : null}
            </div>

            {whatsappUrl ? (
              <Button asChild className="mt-6 w-full bg-[#25D366] hover:bg-[#1da851]">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
