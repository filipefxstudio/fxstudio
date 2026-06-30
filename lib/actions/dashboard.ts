"use server";

import { DIAS_LEAD_NOVO } from "@/lib/constants/config";
import { formatOrigemDisplay, getUltimaAtividadeEm, isLeadAtivo } from "@/lib/leads/format";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { EtapaLead, FinalidadeImovel, Lead, StatusImovel, TemperaturaLead } from "@/types";

export type DashboardTab = "venda" | "locacao";

export interface DashboardKPIItem {
  id: string;
  label: string;
  value: number;
  icon: "leads" | "novos" | "quentes" | "mornos" | "frios";
  href?: string;
}

export interface DashboardFunilItem {
  id: string;
  label: string;
  count: number;
  href: string;
}

export interface DashboardBarItem {
  label: string;
  count: number;
  color: string;
}

export interface DashboardAlertaItem {
  id: string;
  mensagem: string;
  acaoLabel: string;
  href: string;
  tipo: "warning" | "info" | "danger";
}

export interface DashboardLeadRecenteItem {
  id: string;
  nome: string;
  origem: string;
  tempoAtras: string;
  temperatura: TemperaturaLead;
  interesseImovel: string;
  atendido_por: Lead["atendido_por"];
}

export interface DashboardStats {
  kpis: DashboardKPIItem[];
  funil: DashboardFunilItem[];
  imoveisPorStatus: DashboardBarItem[];
  origemLeads: DashboardBarItem[];
  alertas: DashboardAlertaItem[];
  leadsRecentes: DashboardLeadRecenteItem[];
  leadsSemInteracao: number;
}

function finalidadeLeadFromTab(tab: DashboardTab): "compra" | "locacao" {
  return tab === "venda" ? "compra" : "locacao";
}

function finalidadeImovelFromTab(tab: DashboardTab): FinalidadeImovel {
  return tab === "venda" ? "venda" : "locacao";
}

function formatTempoAtras(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutos = Math.floor(diffMs / 60000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias === 1 ? "" : "s"}`;
}

function isLeadNovo(lead: Lead): boolean {
  if (lead.etapa !== "novo") return false;
  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_LEAD_NOVO);
  return new Date(lead.criado_em) >= limite;
}

function isSemInteracao(lead: Lead, dias: number): boolean {
  if (!isLeadAtivo(lead)) return false;
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return new Date(getUltimaAtividadeEm(lead)) < limite;
}

function getInteresseResumido(lead: Lead): string {
  if (lead.imovel?.titulo) return lead.imovel.titulo;

  const partes: string[] = [];
  if (lead.tipo_imovel_busca) partes.push(lead.tipo_imovel_busca);
  if (lead.bairros_interesse?.length) {
    partes.push(lead.bairros_interesse.slice(0, 2).join(", "));
  }
  return partes.length > 0 ? partes.join(" · ") : "Interesse não informado";
}

export async function getDashboardStats(
  tab: DashboardTab,
  diasAlertaInatividade = 7,
): Promise<DashboardStats | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  const supabase = await createClient();
  const finalidadeLead = finalidadeLeadFromTab(tab);
  const finalidadeImovel = finalidadeImovelFromTab(tab);

  const [leadsResult, imoveisResult, interacoesResult, fotosResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*, imovel:imoveis(titulo)")
      .eq("corretor_id", corretor.id)
      .eq("finalidade_busca", finalidadeLead),
    supabase
      .from("imoveis")
      .select("id, status, local_chaves")
      .eq("corretor_id", corretor.id)
      .eq("finalidade", finalidadeImovel),
    supabase
      .from("lead_interacoes")
      .select("lead_id, tipo")
      .eq("corretor_id", corretor.id),
    supabase.from("imovel_fotos").select("imovel_id"),
  ]);

  const leads = (leadsResult.data ?? []) as Lead[];
  const imoveis = imoveisResult.data ?? [];
  const interacoes = interacoesResult.data ?? [];
  const fotos = fotosResult.data ?? [];

  const leadIdsComVisita = new Set(
    interacoes.filter((i) => i.tipo === "visita").map((i) => i.lead_id),
  );
  const leadIdsComProposta = new Set(
    interacoes.filter((i) => i.tipo === "proposta").map((i) => i.lead_id),
  );

  const leadsAtivos = leads.filter(isLeadAtivo);
  const leadsNovos = leadsAtivos.filter(isLeadNovo);
  const quentes = leadsAtivos.filter((l) => l.temperatura === "quente");
  const mornos = leadsAtivos.filter((l) => l.temperatura === "morno");
  const frios = leadsAtivos.filter((l) => l.temperatura === "frio");
  const semInteracao = leadsAtivos.filter((l) =>
    isSemInteracao(l, diasAlertaInatividade),
  );

  const kpis: DashboardKPIItem[] = [
    {
      id: "ativos",
      label: "Leads ativos",
      value: leadsAtivos.length,
      icon: "leads",
      href: `/dashboard/leads?finalidade=${finalidadeLead}`,
    },
    {
      id: "novos",
      label: "Leads novos",
      value: leadsNovos.length,
      icon: "novos",
      href: `/dashboard/leads?etapa=novo&finalidade=${finalidadeLead}`,
    },
    {
      id: "quentes",
      label: "Quentes",
      value: quentes.length,
      icon: "quentes",
      href: `/dashboard/leads?temperatura=quente&finalidade=${finalidadeLead}`,
    },
    {
      id: "mornos",
      label: "Mornos",
      value: mornos.length,
      icon: "mornos",
      href: `/dashboard/leads?temperatura=morno&finalidade=${finalidadeLead}`,
    },
    {
      id: "frios",
      label: "Frios",
      value: frios.length,
      icon: "frios",
      href: `/dashboard/leads?temperatura=frio&finalidade=${finalidadeLead}`,
    },
  ];

  const atendimento = leadsAtivos.filter((l) =>
    (["contato_feito", "qualificado"] as EtapaLead[]).includes(l.etapa),
  );
  const visitas = leadsAtivos.filter((l) => leadIdsComVisita.has(l.id));
  const negociacao = leadsAtivos.filter(
    (l) =>
      leadIdsComProposta.has(l.id) ||
      l.etapa === "proposta" ||
      l.etapa === "negociacao",
  );
  const vendas = leads.filter((l) => l.etapa === "fechado");

  const funil: DashboardFunilItem[] = [
    {
      id: "leads",
      label: "Leads",
      count: leadsAtivos.length,
      href: `/dashboard/leads?finalidade=${finalidadeLead}`,
    },
    {
      id: "atendimento",
      label: "Atendimento",
      count: atendimento.length,
      href: `/dashboard/leads?etapa=contato_feito&finalidade=${finalidadeLead}`,
    },
    {
      id: "visitas",
      label: "Visitas",
      count: visitas.length,
      href: `/dashboard/leads?finalidade=${finalidadeLead}`,
    },
    {
      id: "negociacao",
      label: "Negociação",
      count: negociacao.length,
      href: `/dashboard/leads?etapa=proposta&finalidade=${finalidadeLead}`,
    },
    {
      id: "vendas",
      label: tab === "venda" ? "Vendas" : "Locações",
      count: vendas.length,
      href: `/dashboard/leads?etapa=fechado&finalidade=${finalidadeLead}`,
    },
  ];

  const statusGroups: { key: StatusImovel | "vendido_locado"; label: string; color: string }[] =
    tab === "venda"
      ? [
          { key: "disponivel", label: "Disponível", color: "#2E86AB" },
          { key: "reservado", label: "Reservado", color: "#F18F01" },
          { key: "vendido", label: "Vendido", color: "#2DC653" },
        ]
      : [
          { key: "disponivel", label: "Disponível", color: "#2E86AB" },
          { key: "reservado", label: "Reservado", color: "#F18F01" },
          { key: "locado", label: "Locado", color: "#2DC653" },
        ];

  const imoveisPorStatus: DashboardBarItem[] = statusGroups.map((group) => ({
    label: group.label,
    count: imoveis.filter((i) => i.status === group.key).length,
    color: group.color,
  }));

  const origemMap = new Map<string, number>();
  for (const lead of leadsAtivos) {
    const origem = formatOrigemDisplay(lead.origem);
    origemMap.set(origem, (origemMap.get(origem) ?? 0) + 1);
  }

  const origemLeads: DashboardBarItem[] = Array.from(origemMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count], index) => ({
      label,
      count,
      color: ["#1D3557", "#2E86AB", "#F18F01", "#E63946", "#2DC653", "#6C757D", "#457B9D", "#A8DADC"][
        index % 8
      ],
    }));

  const imovelIdsComFoto = new Set(fotos.map((f) => f.imovel_id));
  const imoveisSemFoto = imoveis.filter((i) => !imovelIdsComFoto.has(i.id)).length;
  const imoveisSemChaves = imoveis.filter((i) => !i.local_chaves).length;
  const leadsFriosCount = frios.length;

  const alertas: DashboardAlertaItem[] = [];

  if (semInteracao.length > 0) {
    alertas.push({
      id: "sem-interacao",
      mensagem: `${semInteracao.length} lead${semInteracao.length === 1 ? "" : "s"} sem interação há +${diasAlertaInatividade} dias`,
      acaoLabel: "Ver leads",
      href: `/dashboard/leads?sem_interacao=${diasAlertaInatividade}&finalidade=${finalidadeLead}`,
      tipo: "warning",
    });
  }

  if (leadsFriosCount > 0) {
    alertas.push({
      id: "leads-frios",
      mensagem: `${leadsFriosCount} lead${leadsFriosCount === 1 ? "" : "s"} frio${leadsFriosCount === 1 ? "" : "s"} no funil`,
      acaoLabel: "Ver leads frios",
      href: `/dashboard/leads?temperatura=frio&finalidade=${finalidadeLead}`,
      tipo: "info",
    });
  }

  if (imoveisSemFoto > 0) {
    alertas.push({
      id: "sem-foto",
      mensagem: `${imoveisSemFoto} imóve${imoveisSemFoto === 1 ? "l sem foto" : "is sem foto"}`,
      acaoLabel: "Ver imóveis",
      href: "/dashboard/imoveis",
      tipo: "info",
    });
  }

  if (imoveisSemChaves > 0) {
    alertas.push({
      id: "sem-chaves",
      mensagem: `${imoveisSemChaves} imóve${imoveisSemChaves === 1 ? "l sem local das chaves" : "is sem local das chaves"}`,
      acaoLabel: "Ver imóveis",
      href: "/dashboard/imoveis",
      tipo: "danger",
    });
  }

  const leadsRecentes: DashboardLeadRecenteItem[] = [...leads]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 5)
    .map((lead) => ({
      id: lead.id,
      nome: lead.nome?.trim() || "Lead sem nome",
      origem: formatOrigemDisplay(lead.origem),
      tempoAtras: formatTempoAtras(lead.criado_em),
      temperatura: lead.temperatura,
      interesseImovel: getInteresseResumido(lead),
      atendido_por: lead.atendido_por,
    }));

  return {
    kpis,
    funil,
    imoveisPorStatus,
    origemLeads,
    alertas,
    leadsRecentes,
    leadsSemInteracao: semInteracao.length,
  };
}

export async function getDashboardStatsBothTabs(diasAlertaInatividade = 7) {
  const [venda, locacao] = await Promise.all([
    getDashboardStats("venda", diasAlertaInatividade),
    getDashboardStats("locacao", diasAlertaInatividade),
  ]);

  return { venda, locacao };
}
