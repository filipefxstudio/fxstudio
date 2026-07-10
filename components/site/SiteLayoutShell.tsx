import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { FooterSite } from "@/components/site/FooterSite";
import { NavbarSite } from "@/components/site/NavbarSite";
import { SiteProvider } from "@/components/site/SiteProvider";
import { TarjaSite } from "@/components/site/TarjaSite";
import { WhatsAppWidget } from "@/components/site/WhatsAppWidget";
import {
  DEFAULT_SITE_COR_PRIMARIA,
  DEFAULT_SITE_COR_SECUNDARIA,
} from "@/lib/constants/site";
import { getSiteCreci, getSocialLinks } from "@/lib/site/social";
import { hasImoveisLocacao as fetchHasImoveisLocacao } from "@/lib/site/queries";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getWhatsAppNumber } from "@/lib/site/whatsapp";
import type { Corretor } from "@/types";

interface SiteLayoutShellProps {
  corretor: Corretor;
  basePath: string;
  children: React.ReactNode;
}

async function isWhatsAppChatEnabled(corretor: Corretor): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("corretores")
      .select("zapi_instance_id, zapi_token, whatsapp, telefone")
      .eq("id", corretor.id)
      .maybeSingle();

    if (!data?.zapi_instance_id?.trim() || !data.zapi_token?.trim()) {
      return false;
    }

    return Boolean(getWhatsAppNumber({ ...corretor, ...data }));
  } catch {
    return false;
  }
}

export async function SiteLayoutShell({ corretor, basePath, children }: SiteLayoutShellProps) {
  if (!corretor) {
    notFound();
  }

  const corPrimaria = corretor.site_cor_primaria ?? DEFAULT_SITE_COR_PRIMARIA;
  const corSecundaria = corretor.site_cor_secundaria ?? DEFAULT_SITE_COR_SECUNDARIA;
  const temImoveisLocacao = await fetchHasImoveisLocacao(corretor.id);

  const hasTarja = Boolean(
    getSiteCreci(corretor) ||
      corretor.site_telefone_vendas?.trim() ||
      corretor.site_telefone_locacao?.trim() ||
      getSocialLinks(corretor).length > 0,
  );

  const whatsappChatEnabled = await isWhatsAppChatEnabled(corretor);

  return (
    <SiteProvider
      corretor={corretor}
      basePath={basePath}
      hasImoveisLocacao={temImoveisLocacao}
      whatsappChatEnabled={whatsappChatEnabled}
      hasTarja={hasTarja}
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
            "--site-tarja-offset": hasTarja ? "2rem" : "0px",
          } as CSSProperties
        }
      >
        {hasTarja ? <TarjaSite corretor={corretor} /> : null}
        <div
          className="flex min-h-full flex-1 flex-col"
          style={{ paddingTop: hasTarja ? "2rem" : undefined }}
        >
          <NavbarSite />
          <main className="flex-1">{children}</main>
          <FooterSite corretor={corretor} basePath={basePath} />
          <WhatsAppWidget />
        </div>
      </div>
    </SiteProvider>
  );
}
