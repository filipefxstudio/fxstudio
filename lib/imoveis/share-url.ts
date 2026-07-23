/**
 * URL pública de compartilhamento do imóvel no site do corretor.
 */
export function getPublicImovelShareUrl(corretorSlug: string, imovelSlug: string): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_BASE_URL?.replace(/\/$/, "");

  if (envBase) {
    return `${envBase}/${corretorSlug}/imoveis/${imovelSlug}`;
  }

  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "deskimob.com.br";
  return `https://${corretorSlug}.${mainDomain}/imoveis/${imovelSlug}`;
}

/**
 * Versão client-side com fallback para window.location.origin.
 */
export function getPublicImovelShareUrlClient(
  corretorSlug: string,
  imovelSlug: string,
): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_BASE_URL?.replace(/\/$/, "");

  if (envBase) {
    return `${envBase}/${corretorSlug}/imoveis/${imovelSlug}`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return `${window.location.origin}/${corretorSlug}/imoveis/${imovelSlug}`;
    }
  }

  return getPublicImovelShareUrl(corretorSlug, imovelSlug);
}
