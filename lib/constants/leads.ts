import type { EtapaLead, OrigemLead } from "@/types";

export const ETAPAS_LEAD: readonly EtapaLead[] = [
  "novo",
  "contato_feito",
  "qualificado",
  "visita_agendada",
  "proposta",
  "negociacao",
  "fechado",
  "perdido",
] as const;

export const ETAPA_LEAD_LABELS: Record<EtapaLead, string> = {
  novo: "Novo",
  contato_feito: "Contato feito",
  qualificado: "Qualificado",
  visita_agendada: "Visita agendada",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const ORIGEM_LEAD_LABELS: Record<OrigemLead, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  portal: "Portal",
  indicacao: "Indicação",
  manual: "Manual",
};

export function isEtapaLead(value: string): value is EtapaLead {
  return ETAPAS_LEAD.includes(value as EtapaLead);
}
