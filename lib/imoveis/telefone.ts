export function formatTelefoneBr(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function telefoneDigits(telefone: string | null | undefined): string {
  return telefone?.replace(/\D/g, "") ?? "";
}

/** tel: link sem +55 — apenas DDD + número */
export function buildTelLinkLocal(telefone: string | null | undefined): string | null {
  const digits = telefoneDigits(telefone);
  return digits.length >= 10 ? `tel:${digits}` : null;
}

export function buildWhatsAppLink(telefone: string | null | undefined): string | null {
  const digits = telefoneDigits(telefone);
  return digits.length >= 10 ? `https://wa.me/55${digits}` : null;
}
