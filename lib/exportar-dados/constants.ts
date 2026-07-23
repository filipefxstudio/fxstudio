import type { ExportGroupConfig, GrupoExportacao } from "@/lib/exportar-dados/types";

export const EXPORT_GROUPS: ExportGroupConfig[] = [
  {
    id: "imoveis",
    label: "Imóveis",
    description: "Inclui fotos (metadados/URLs), captadores, proprietários e auditoria.",
    tables: [
      { table: "imoveis", hasCorretorId: true },
      {
        table: "imovel_fotos",
        select: "id, imovel_id, url, ordem, legenda",
        hasCorretorId: false,
      },
      { table: "imovel_captadores", hasCorretorId: false },
      { table: "imovel_proprietarios", hasCorretorId: false },
      { table: "auditoria_imovel", hasCorretorId: false },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Cadastro completo de clientes e leads/proprietários.",
    tables: [{ table: "clientes", hasCorretorId: true, hasPerfilId: true }],
  },
  {
    id: "atendimentos",
    label: "Atendimentos/Leads",
    description: "Leads, interações, imóveis selecionados e auditoria de atendimento.",
    tables: [
      { table: "leads", hasCorretorId: true, hasPerfilId: true },
      { table: "lead_interacoes", hasCorretorId: true },
      { table: "lead_imoveis_selecionados", hasCorretorId: true },
      { table: "auditoria_atendimento", hasCorretorId: true },
    ],
  },
  {
    id: "visitas",
    label: "Visitas",
    description: "Registros de visitas realizadas e agendadas.",
    tables: [{ table: "visitas", hasCorretorId: true }],
  },
  {
    id: "propostas",
    label: "Propostas",
    description: "Propostas enviadas e recebidas nos atendimentos.",
    tables: [{ table: "propostas", hasCorretorId: true }],
  },
  {
    id: "negocios",
    label: "Negócios fechados",
    description: "Negócios concluídos e rateios de comissão.",
    tables: [{ table: "negocios", hasCorretorId: true }],
  },
  {
    id: "agenda",
    label: "Agenda",
    description: "Compromissos e lembretes da agenda.",
    tables: [{ table: "agenda", hasCorretorId: true, hasPerfilId: true }],
  },
];

export const ALL_EXPORT_GROUPS: GrupoExportacao[] = EXPORT_GROUPS.map((group) => group.id);

export function getExportGroupConfig(id: GrupoExportacao): ExportGroupConfig | undefined {
  return EXPORT_GROUPS.find((group) => group.id === id);
}
