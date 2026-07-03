import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteLayoutShell } from "@/components/site/SiteLayoutShell";
import { resolveSiteBasePath } from "@/lib/site/paths";
import { getCorretorBySlug } from "@/lib/site/queries";

export const dynamic = "force-dynamic";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantLayoutProps): Promise<Metadata> {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);

  if (!corretor) {
    return { title: "Site não encontrado" };
  }

  return {
    title: `${corretor.nome} — Imóveis`,
    description: corretor.sobre_texto ?? corretor.sobre ?? `Imóveis disponíveis com ${corretor.nome}`,
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant } = await params;
  const corretor = await getCorretorBySlug(tenant);
  const basePath = await resolveSiteBasePath({ tenantSlug: tenant, routeKind: "slug" });

  if (!corretor) {
    notFound();
  }

  return (
    <SiteLayoutShell corretor={corretor} basePath={basePath}>
      {children}
    </SiteLayoutShell>
  );
}
