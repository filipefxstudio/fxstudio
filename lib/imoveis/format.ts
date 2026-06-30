import type { Imovel } from "@/types";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Consulte";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getImovelCodigo(imovel: Pick<Imovel, "id" | "codigo">): string {
  if (imovel.codigo) {
    return `#${imovel.codigo.padStart(4, "0")}`;
  }

  const slice = imovel.id.replace(/-/g, "").slice(-4).toUpperCase();
  return `#${slice}`;
}

export function formatEnderecoCurto(imovel: Imovel): string {
  const partes = [imovel.logradouro, imovel.numero].filter(Boolean);
  return partes.join(", ") || "Endereço não informado";
}

export function getValorNumerico(imovel: Imovel): number | null {
  if (imovel.finalidade === "venda") {
    return imovel.valor_venda ?? null;
  }
  return imovel.valor_locacao ?? null;
}

export function getPublicImovelUrl(corretorSlug: string, imovelSlug: string): string {
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "fxstudio.com.br";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return `${window.location.origin}/${corretorSlug}/imoveis/${imovelSlug}`;
    }
  }

  return `https://${corretorSlug}.${mainDomain}/imoveis/${imovelSlug}`;
}
