import {
  DEFAULT_FICHA_VISITA_CLAUSULA,
  DEFAULT_PERCENTUAL_COMISSAO,
  DIAS_SEMANA_PT,
  MESES_PT,
} from "@/lib/ficha-visita/constants";
import { formatCurrency } from "@/lib/imoveis/format";
import type { Corretor } from "@/types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatPercentual(value: number): string {
  const fixed = value.toFixed(2).replace(/\.?0+$/, "");
  return fixed.replace(".", ",");
}

export function interpolateClausula(
  template: string,
  vars: { imobiliaria: string; percentual: number; corretor?: string },
): string {
  const pct = formatPercentual(vars.percentual);
  return template
    .replace(/\{\{imobiliaria\}\}/g, vars.imobiliaria)
    .replace(/\{\{percentual\}\}/g, pct)
    .replace(/\{\{corretor\}\}/g, vars.corretor ?? "");
}

export function getClausulaTexto(
  usaTextoPadrao: boolean,
  textoClausula: string | null | undefined,
  vars: { imobiliaria: string; percentual: number; corretor: string },
): string {
  const base = usaTextoPadrao
    ? DEFAULT_FICHA_VISITA_CLAUSULA
    : (textoClausula?.trim() || DEFAULT_FICHA_VISITA_CLAUSULA);
  return interpolateClausula(base, vars);
}

export function getOfficeDisplay(corretor: Corretor): {
  nome: string;
  endereco: string;
  telefone: string;
} {
  return {
    nome: corretor.site_nome_exibicao?.trim() || corretor.nome,
    endereco: corretor.site_endereco?.trim() || corretor.contato_endereco?.trim() || "",
    telefone:
      corretor.site_telefone_vendas?.trim() ||
      corretor.contato_telefone?.trim() ||
      corretor.telefone?.trim() ||
      "",
  };
}

/** Extrai cidade do endereço do escritório quando não há cidade nos imóveis. */
export function extractCidadeFromEndereco(endereco: string): string {
  if (!endereco.trim()) return "";

  const slashMatch = endereco.match(/,\s*([^,/]+?)(?:\s*[-/]\s*[A-Z]{2})?\s*$/);
  if (slashMatch) return slashMatch[1].trim();

  const parts = endereco.split(/\s[-–—]\s/);
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/\s*\/\s*[A-Z]{2}\s*$/, "").trim();
  }

  const commaParts = endereco.split(",");
  return commaParts[commaParts.length - 1]?.trim() ?? "";
}

/**
 * Cidade do rodapé: primeiro imóvel selecionado; se ausente, cidade do escritório (site contato).
 */
export function resolveCidadeDocumento(
  imoveisCidades: (string | null | undefined)[],
  corretor: Corretor,
): string {
  for (const cidade of imoveisCidades) {
    if (cidade?.trim()) return cidade.trim();
  }
  return extractCidadeFromEndereco(getOfficeDisplay(corretor).endereco);
}

export function formatDataLocalPorExtenso(date: Date, cidade: string): string {
  const diaSemana = DIAS_SEMANA_PT[date.getDay()];
  const dia = date.getDate();
  const mes = MESES_PT[date.getMonth()];
  const ano = date.getFullYear();
  return `${cidade}, ${diaSemana}, ${dia} de ${mes} de ${ano}`;
}

export interface ImovelFichaRow {
  codigo?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  finalidade?: string | null;
  valor_venda?: number | null;
  valor_locacao?: number | null;
}

export function formatEnderecoImovel(imovel: ImovelFichaRow): string {
  const logradouro = [imovel.logradouro, imovel.numero].filter(Boolean).join(", ");
  const partes = [logradouro, imovel.complemento].filter(Boolean);
  return partes.join(" — ") || "—";
}

export function formatValorImovel(imovel: ImovelFichaRow): string {
  const valor =
    imovel.finalidade === "venda" ? imovel.valor_venda : imovel.valor_locacao;
  if (valor == null) return "—";
  return formatCurrency(valor);
}

export function resolvePercentualComissao(value: number | null | undefined): number {
  if (value == null || Number.isNaN(Number(value))) {
    return DEFAULT_PERCENTUAL_COMISSAO;
  }
  return Number(value);
}
