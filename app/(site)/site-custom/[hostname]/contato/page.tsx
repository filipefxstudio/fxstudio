import type { Metadata } from "next";

import { SiteContatoContent } from "@/components/site/SiteContatoContent";
import { getCorretorByDominio } from "@/lib/site/queries";

interface CustomContatoPageProps {
  params: Promise<{ hostname: string }>;
}

export async function generateMetadata({ params }: CustomContatoPageProps): Promise<Metadata> {
  const { hostname } = await params;
  const corretor = await getCorretorByDominio(decodeURIComponent(hostname));

  return {
    title: corretor ? `Contato | ${corretor.nome}` : "Contato",
    description: `Entre em contato com ${corretor?.nome ?? "o corretor"}.`,
  };
}

export default async function CustomContatoPage({ params }: CustomContatoPageProps) {
  const { hostname } = await params;
  const corretor = await getCorretorByDominio(decodeURIComponent(hostname));

  if (!corretor) {
    return null;
  }

  return <SiteContatoContent corretor={corretor} />;
}
