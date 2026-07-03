import type { EtapaLead } from "@/types";

/** Ordem do funil para validação de avanço (nunca retroceder). */
export const ETAPA_FUNIL_ORDEM: Record<EtapaLead, number> = {
  novo: 0,
  contato_feito: 1,
  qualificado: 2,
  visita_agendada: 3,
  proposta: 4,
  negociacao: 4,
  fechado: 5,
  perdido: 5,
};

export function podeAvancarEtapa(atual: EtapaLead, nova: EtapaLead): boolean {
  if (atual === nova) return true;
  return ETAPA_FUNIL_ORDEM[nova] >= ETAPA_FUNIL_ORDEM[atual];
}

export function normalizarEtapaKanban(etapa: EtapaLead): EtapaLead {
  if (etapa === "negociacao") return "proposta";
  return etapa;
}
