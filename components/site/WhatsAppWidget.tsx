"use client";

import { MessageCircle } from "lucide-react";

import { buildWhatsAppUrl, buildContatoWhatsAppMessage } from "@/lib/site/whatsapp";

import { useSite } from "./SiteProvider";

export function WhatsAppWidget() {
  const { corretor } = useSite();
  const whatsappUrl = buildWhatsAppUrl(corretor, buildContatoWhatsAppMessage());

  if (!whatsappUrl) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1da851]"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
