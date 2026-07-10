import type { TipoAgenda } from "@/types";

export interface TipoCompromissoConfig {
  slug: TipoAgenda;
  nome: string;
  icone: string;
}

export const TIPOS_COMPROMISSO: TipoCompromissoConfig[] = [
  { slug: "visita", nome: "Visita", icone: "🏠" },
  { slug: "ligacao", nome: "Ligação", icone: "📞" },
  { slug: "whatsapp", nome: "WhatsApp", icone: "💬" },
  { slug: "reuniao", nome: "Reunião", icone: "👥" },
  { slug: "captacao", nome: "Captação", icone: "📷" },
  { slug: "email", nome: "Email", icone: "✉️" },
  { slug: "outro", nome: "Outro", icone: "📅" },
];

const LEGACY_TIPO_MAP: Partial<Record<TipoAgenda, TipoCompromissoConfig>> = {
  tarefa: { slug: "email", nome: "Email", icone: "✉️" },
  lembrete: { slug: "whatsapp", nome: "WhatsApp", icone: "💬" },
};

export function getTipoCompromisso(tipo: TipoAgenda): TipoCompromissoConfig {
  const found = TIPOS_COMPROMISSO.find((t) => t.slug === tipo);
  if (found) return found;
  return LEGACY_TIPO_MAP[tipo] ?? { slug: tipo, nome: "Outro", icone: "📅" };
}

export type AgendaPeriodoFiltro =
  | "atrasados"
  | "hoje"
  | "esta_semana"
  | "proxima_semana"
  | "este_mes"
  | "personalizado";

export const PERIODO_FILTRO_LABELS: Record<AgendaPeriodoFiltro, string> = {
  atrasados: "Atrasados",
  hoje: "Hoje",
  esta_semana: "Esta semana",
  proxima_semana: "Próxima semana",
  este_mes: "Este mês",
  personalizado: "Selecionar período",
};
