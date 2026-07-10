"use client";

import { MessageCircle, Phone } from "lucide-react";

import { SocialIcons } from "@/components/site/SocialIcons";
import { getSiteCreci, getSocialLinks } from "@/lib/site/social";
import { buildWhatsAppUrl } from "@/lib/site/whatsapp";
import type { Corretor } from "@/types";

interface TarjaSiteProps {
  corretor: Corretor;
}

function PhoneLink({ telefone, label }: { telefone: string; label: string }) {
  const whatsappUrl = buildWhatsAppUrl(
    { telefone } as Corretor,
    `Olá! Gostaria de informações sobre imóveis para ${label.toLowerCase()}.`,
  );

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Phone className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="hidden sm:inline">{label}:</span>
      <a href={`tel:${telefone.replace(/\D/g, "")}`} className="hover:underline">
        {telefone}
      </a>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${label}`}
          className="inline-flex size-5 items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80"
        >
          <MessageCircle className="size-3" />
        </a>
      ) : null}
    </span>
  );
}

export function TarjaSite({ corretor }: TarjaSiteProps) {
  const tarjaCor = corretor.site_tarja_cor ?? "#1a1a2e";
  const creci = getSiteCreci(corretor);
  const socialLinks = getSocialLinks(corretor);
  const telVendas = corretor.site_telefone_vendas?.trim();
  const telLocacao = corretor.site_telefone_locacao?.trim();

  const hasContent = creci || telVendas || telLocacao || socialLinks.length > 0;
  if (!hasContent) return null;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[60] flex h-8 items-center text-xs text-white"
      style={{ backgroundColor: tarjaCor }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {creci ? (
            <span className="shrink-0 whitespace-nowrap font-medium">CRECI {creci}</span>
          ) : null}
          {telVendas ? <PhoneLink telefone={telVendas} label="Vendas" /> : null}
          {telLocacao ? <PhoneLink telefone={telLocacao} label="Locação" /> : null}
        </div>
        <SocialIcons links={socialLinks} iconClassName="size-3.5" />
      </div>
    </div>
  );
}
