import { FINALIDADES_IMOVEL, TIPOS_IMOVEL } from "@/lib/constants/imoveis";
import { formatCurrency } from "@/lib/imoveis/format";
import type { FinalidadeImovel, Imovel, TipoImovel } from "@/types";

export { formatCurrency };

export function getTipoLabel(tipo: TipoImovel): string {
  return TIPOS_IMOVEL.find((item) => item.value === tipo)?.label ?? tipo;
}

export function getFinalidadeLabel(finalidade: FinalidadeImovel): string {
  return FINALIDADES_IMOVEL.find((item) => item.value === finalidade)?.label ?? finalidade;
}

export function getValorExibicao(imovel: Imovel): string {
  if (imovel.finalidade === "venda") {
    return formatCurrency(imovel.valor_venda);
  }

  return `${formatCurrency(imovel.valor_locacao)}/mês`;
}

export function getCapaUrl(imovel: Imovel): string | null {
  const fotos = imovel.fotos ?? [];
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);
  return ordenadas[0]?.url ?? null;
}

export function formatEndereco(imovel: Imovel): string {
  const partes = [
    imovel.logradouro,
    imovel.numero,
    imovel.bairro,
    imovel.cidade,
    imovel.estado,
  ].filter(Boolean);

  return partes.join(", ");
}
