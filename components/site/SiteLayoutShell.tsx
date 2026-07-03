import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { FooterSite } from "@/components/site/FooterSite";
import { NavbarSite } from "@/components/site/NavbarSite";
import { SiteProvider } from "@/components/site/SiteProvider";
import { WhatsAppWidget } from "@/components/site/WhatsAppWidget";
import {
  DEFAULT_SITE_COR_PRIMARIA,
  DEFAULT_SITE_COR_SECUNDARIA,
} from "@/lib/constants/site";
import { hasImoveisLocacao as fetchHasImoveisLocacao } from "@/lib/site/queries";
import type { Corretor } from "@/types";

interface SiteLayoutShellProps {
  corretor: Corretor | null;
  basePath: string;
  children: React.ReactNode;
}

export async function SiteLayoutShell({ corretor, basePath, children }: SiteLayoutShellProps) {
  if (!corretor) {
    notFound();
  }

  const corPrimaria = corretor.site_cor_primaria ?? DEFAULT_SITE_COR_PRIMARIA;
  const corSecundaria = corretor.site_cor_secundaria ?? DEFAULT_SITE_COR_SECUNDARIA;
  const temImoveisLocacao = await fetchHasImoveisLocacao(corretor.id);

  return (
    <SiteProvider
      corretor={corretor}
      basePath={basePath}
      hasImoveisLocacao={temImoveisLocacao}
    >
      <div
        className="flex min-h-full flex-col bg-white text-[#2D3748]"
        style={
          {
            "--primary": corPrimaria,
            "--secondary": corSecundaria,
            "--accent": corSecundaria,
            "--color-primary": corPrimaria,
            "--color-secondary": corSecundaria,
          } as CSSProperties
        }
      >
        <NavbarSite />
        <main className="flex-1">{children}</main>
        <FooterSite corretor={corretor} basePath={basePath} />
        <WhatsAppWidget />
      </div>
    </SiteProvider>
  );
}
