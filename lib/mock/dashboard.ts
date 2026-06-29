export type LeadOrigem = "whatsapp" | "site";

export type LeadTemperatura = "quente" | "morno" | "frio";

export type AtendidoPor = "agente_ia" | "corretor";

export type FunilEtapaSlug =
  | "novo"
  | "contato"
  | "qualificado"
  | "visita"
  | "proposta"
  | "negociacao";

export interface DashboardKPI {
  id: string;
  label: string;
  value: number;
  icon: "imoveis" | "leads" | "quentes" | "visitas";
}

export interface LeadRecente {
  id: string;
  nome: string;
  origem: LeadOrigem;
  tempoAtras: string;
  temperatura: LeadTemperatura;
  interesseImovel: string;
  atendido_por: AtendidoPor;
}

export interface DashboardAlerta {
  id: string;
  mensagem: string;
  acaoLabel: string;
  href: string;
  tipo: "warning" | "info" | "danger";
}

export interface FunilEtapa {
  etapa: FunilEtapaSlug;
  label: string;
  count: number;
}

export interface OnboardingItem {
  id: string;
  label: string;
  concluido: boolean;
  href?: string;
}

export const dashboardKPIs: DashboardKPI[] = [
  { id: "imoveis-ativos", label: "Imóveis ativos", value: 12, icon: "imoveis" },
  { id: "leads-hoje", label: "Leads hoje", value: 3, icon: "leads" },
  { id: "quentes-funil", label: "Quentes no funil", value: 5, icon: "quentes" },
  { id: "visitas-semana", label: "Visitas semana", value: 2, icon: "visitas" },
];

export const leadsRecentes: LeadRecente[] = [
  {
    id: "1",
    nome: "Ana Paula Silva",
    origem: "whatsapp",
    tempoAtras: "há 12 min",
    temperatura: "quente",
    interesseImovel: "Apartamento 2 quartos — Jardins",
    atendido_por: "agente_ia",
  },
  {
    id: "2",
    nome: "Carlos Mendes",
    origem: "site",
    tempoAtras: "há 45 min",
    temperatura: "morno",
    interesseImovel: "Casa com piscina — Alphaville",
    atendido_por: "corretor",
  },
  {
    id: "3",
    nome: "Juliana Costa",
    origem: "whatsapp",
    tempoAtras: "há 1 h",
    temperatura: "quente",
    interesseImovel: "Studio — Centro",
    atendido_por: "agente_ia",
  },
  {
    id: "4",
    nome: "Roberto Alves",
    origem: "site",
    tempoAtras: "há 2 h",
    temperatura: "frio",
    interesseImovel: "Terreno — Condomínio Horizonte",
    atendido_por: "corretor",
  },
  {
    id: "5",
    nome: "Fernanda Lima",
    origem: "whatsapp",
    tempoAtras: "há 3 h",
    temperatura: "morno",
    interesseImovel: "Apartamento 3 quartos — Moema",
    atendido_por: "agente_ia",
  },
];

export const dashboardAlertas: DashboardAlerta[] = [
  {
    id: "leads-frios",
    mensagem: "3 leads sem contato há +7 dias",
    acaoLabel: "Ver leads frios",
    href: "/dashboard/leads?filtro=frios",
    tipo: "warning",
  },
  {
    id: "imoveis-sem-foto",
    mensagem: "2 imóveis sem foto",
    acaoLabel: "Adicionar fotos",
    href: "/dashboard/imoveis?filtro=sem-foto",
    tipo: "info",
  },
  {
    id: "follow-up-hoje",
    mensagem: "1 follow-up para hoje",
    acaoLabel: "Ver agenda",
    href: "/dashboard/leads?filtro=follow-up",
    tipo: "danger",
  },
];

export const funilEtapas: FunilEtapa[] = [
  { etapa: "novo", label: "Novo", count: 8 },
  { etapa: "contato", label: "Contato", count: 5 },
  { etapa: "qualificado", label: "Qualificado", count: 4 },
  { etapa: "visita", label: "Visita", count: 3 },
  { etapa: "proposta", label: "Proposta", count: 2 },
  { etapa: "negociacao", label: "Negociação", count: 1 },
];

export function getOnboardingItems(options: {
  perfilCompleto: boolean;
}): OnboardingItem[] {
  return [
    { id: "conta", label: "Conta criada", concluido: true },
    {
      id: "perfil",
      label: "Complete perfil",
      concluido: options.perfilCompleto,
      href: "/dashboard/configuracoes",
    },
    {
      id: "whatsapp",
      label: "Configure WhatsApp",
      concluido: false,
      href: "/dashboard/configuracoes",
    },
    {
      id: "imovel",
      label: "Cadastre imóvel",
      concluido: false,
      href: "/dashboard/imoveis/novo",
    },
    {
      id: "site",
      label: "Veja site",
      concluido: false,
    },
  ];
}
