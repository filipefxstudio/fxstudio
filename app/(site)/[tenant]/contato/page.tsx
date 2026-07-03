import type { Metadata } from "next";

import { SiteContatoContent } from "@/components/site/SiteContatoContent";
import { getCorretorBySlug } from "@/lib/site/queries";

interface ContatoPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: ContatoPageProps): Promise<Metadata> {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);

  return {
    title: corretor ? `Contato | ${corretor.nome}` : "Contato",
    description: `Entre em contato com ${corretor?.nome ?? "o corretor"}.`,
  };
}

export default async function ContatoPage({ params }: ContatoPageProps) {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    return null;
  }

  return <SiteContatoContent corretor={corretor} />;
}
