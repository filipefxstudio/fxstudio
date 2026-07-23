import type { Lead, EtapaLead } from "@/types";

/** Ordem do funil para validação de avanço (nunca retroceder). */
export const ETAPA_FUNIL_ORDEM: Record<EtapaLead, number> = {
  novo: 0,
  contato_feito: 1,
  qualificado: 2,
  visita_agendada: 3,
  proposta: 4,
  negociacao: 4,
  venda: 5,
  fechado: 5,
  perdido: 5,
};

export function podeAvancarEtapa(atual: EtapaLead, nova: EtapaLead): boolean {
  if (atual === nova) return true;
  return ETAPA_FUNIL_ORDEM[nova] >= ETAPA_FUNIL_ORDEM[atual];
}

export function normalizarEtapaKanban(etapa: EtapaLead): EtapaLead {
  if (etapa === "negociacao") return "proposta";
  if (etapa === "fechado") return "venda";
  return etapa;
}

/** Resolve a coluna do kanban considerando etapa legada e situação do atendimento. */
export function resolveKanbanEtapa(lead: Pick<Lead, "etapa" | "situacao">): EtapaLead {
  if (lead.situacao === "negocio_fechado") {
    return "venda";
  }

  return normalizarEtapaKanban(lead.etapa);
}

export function leadMatchesEtapaFilter(
  lead: Pick<Lead, "etapa" | "situacao">,
  etapa: EtapaLead,
): boolean {
  if (resolveKanbanEtapa(lead) === etapa) {
    return true;
  }

  if (etapa === "proposta" && lead.etapa === "negociacao") {
    return true;
  }

  return lead.etapa === etapa;
}
