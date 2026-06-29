import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, buildContatoWhatsAppMessage } from "@/lib/site/whatsapp";
import { sitePath, resolveSiteBasePath } from "@/lib/site/paths";
import { getCorretorBySlug } from "@/lib/site/queries";

interface SobrePageProps {
  params: Promise<{ tenant: string }>;
}

export default async function SobrePage({ params }: SobrePageProps) {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    return null;
  }

  const basePath = await resolveSiteBasePath({ tenantSlug: tenant, routeKind: "slug" });
  const whatsappUrl = buildWhatsAppUrl(corretor, buildContatoWhatsAppMessage());

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Sobre {corretor.nome}</h1>
      {corretor.creci ? (
        <p className="mt-2 text-muted-foreground">CRECI {corretor.creci}</p>
      ) : null}

      <div className="mt-8 space-y-4 leading-relaxed text-[#2D3748]">
        {corretor.sobre ? (
          <p className="whitespace-pre-line">{corretor.sobre}</p>
        ) : (
          <p>
            Corretor de imóveis dedicado a encontrar a melhor oportunidade para compra ou
            locação, com atendimento personalizado e transparência em cada etapa.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={sitePath(basePath, "/imoveis")}>Ver imóveis</Link>
        </Button>
        {whatsappUrl ? (
          <Button asChild variant="outline">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
