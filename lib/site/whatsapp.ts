import type { Corretor, Imovel } from "@/types";

import { formatCurrency, getValorExibicao } from "@/lib/site/format";

function sanitizeTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

export function getWhatsAppNumber(corretor: Corretor): string | null {
  const raw = corretor.whatsapp ?? corretor.telefone;
  if (!raw) {
    return null;
  }

  const digits = sanitizeTelefone(raw);
  if (!digits) {
    return null;
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

export function buildWhatsAppUrl(
  corretor: Corretor,
  message?: string,
): string | null {
  const number = getWhatsAppNumber(corretor);
  if (!number) {
    return null;
  }

  const base = `https://wa.me/${number}`;
  if (!message) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildImovelWhatsAppMessage(imovel: Imovel, pageUrl: string): string {
  const titulo = imovel.titulo ?? "Imóvel";
  const valor = getValorExibicao(imovel);

  return [
    `Olá! Tenho interesse no imóvel: ${titulo}.`,
    `Valor: ${valor}.`,
    `Link: ${pageUrl}`,
  ].join("\n");
}

export function buildImovelWhatsAppUrl(corretor: Corretor, imovel: Imovel, pageUrl: string): string | null {
  return buildWhatsAppUrl(corretor, buildImovelWhatsAppMessage(imovel, pageUrl));
}

export function buildContatoWhatsAppMessage(): string {
  return "Olá! Gostaria de mais informações sobre os imóveis disponíveis.";
}
