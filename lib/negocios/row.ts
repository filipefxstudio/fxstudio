import type { CreateNegocioInput } from "@/lib/negocios/types";
import type { NegocioRateioItem } from "@/types";

export interface NegocioRowExtras {
  corretor_id?: string;
  lead_id?: string;
  status?: string;
}

export function buildNegocioRow(
  input: CreateNegocioInput,
  extras: NegocioRowExtras,
  includeExtendedFields: boolean,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    ...extras,
    imovel_id: input.imovel_id,
    proposta_id: input.proposta_id ?? null,
    perfil_id: input.perfil_id ?? null,
    valor_fechamento: input.valor_fechamento,
    valor_comissao: input.valor_comissao ?? null,
    percentual_comissao: input.percentual_comissao ?? null,
    data_fechamento: input.data_fechamento,
    data_prevista_comissao: input.data_prevista_comissao ?? null,
    forma_pagamento: input.forma_pagamento ?? null,
    observacoes: input.observacoes?.trim() || null,
  };

  if (includeExtendedFields) {
    row.valor_recursos_proprios = input.valor_recursos_proprios ?? null;
    row.valor_financiado = input.valor_financiado ?? null;
    row.valor_fgts = input.valor_fgts ?? null;
    row.rateio = sanitizeRateio(input.rateio);
    return row;
  }

  const observacoesExtras = buildObservacoesFallback(input);
  if (observacoesExtras) {
    row.observacoes = row.observacoes
      ? `${row.observacoes}\n\n${observacoesExtras}`
      : observacoesExtras;
  }

  return row;
}

function sanitizeRateio(rateio?: NegocioRateioItem[]): NegocioRateioItem[] {
  return (rateio ?? []).map(({ perfil_id, papel, percentual, valor }) => ({
    perfil_id,
    papel,
    percentual,
    valor,
  }));
}

function buildObservacoesFallback(input: CreateNegocioInput): string | null {
  const hasFinanciamento =
    input.forma_pagamento === "financiado" &&
    (input.valor_recursos_proprios != null ||
      input.valor_financiado != null ||
      input.valor_fgts != null);
  const hasRateio = (input.rateio?.length ?? 0) > 0;

  if (!hasFinanciamento && !hasRateio) return null;

  return JSON.stringify({
    _negocio_pendente_migracao: {
      valor_recursos_proprios: input.valor_recursos_proprios ?? null,
      valor_financiado: input.valor_financiado ?? null,
      valor_fgts: input.valor_fgts ?? null,
      rateio: sanitizeRateio(input.rateio),
    },
  });
}

export function logSupabaseError(context: string, error: unknown): void {
  const err = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null;

  console.error(`[${context}]`, {
    message: err?.message,
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
  });
}
