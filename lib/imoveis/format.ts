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

import { getPublicImovelShareUrlClient } from "@/lib/imoveis/share-url";

/** @deprecated Use getPublicImovelShareUrlClient ou getPublicImovelShareUrl */
export function getPublicImovelUrl(corretorSlug: string, imovelSlug: string): string {
  return getPublicImovelShareUrlClient(corretorSlug, imovelSlug);
}
