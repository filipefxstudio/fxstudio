import type { EtapaLead, OrigemLead, TemperaturaLead } from "@/types";

/** Colunas do funil Kanban (7 etapas visíveis). */
export const ETAPAS_LEAD: readonly EtapaLead[] = [
  "novo",
  "contato_feito",
  "qualificado",
  "visita_agendada",
  "proposta",
  "fechado",
  "perdido",
] as const;

export const ETAPA_LEAD_LABELS: Record<EtapaLead, string> = {
  novo: "Leads",
  contato_feito: "Contato feito",
  qualificado: "Qualificado",
  visita_agendada: "Visita",
  proposta: "Proposta",
  negociacao: "Proposta",
  fechado: "Venda",
  perdido: "Negócio perdido",
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

export const TEMPERATURA_LEAD_COLORS: Record<TemperaturaLead, string> = {
  quente: "#E63946",
  morno: "#F18F01",
  frio: "#2E86AB",
  indefinido: "#9CA3AF",
};

export const TEMPERATURA_LEAD_LABELS: Record<TemperaturaLead, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  indefinido: "Indefinido",
};

export const FINALIDADE_BUSCA_OPTIONS = [
  { value: "compra", label: "Compra" },
  { value: "locacao", label: "Locação" },
] as const;

export const ETAPAS_LEAD_ATIVAS: readonly EtapaLead[] = ETAPAS_LEAD.filter(
  (etapa) => etapa !== "fechado" && etapa !== "perdido",
);
