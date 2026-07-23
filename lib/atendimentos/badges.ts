import type { Negocio, Proposta, StatusVisita, Visita } from "@/types";

export type ImovelWorkflowBadgeVariant = "visita" | "proposta" | "negocio_fechado";

const VISITA_AGENDADA: StatusVisita[] = ["agendada", "confirmada"];
const PROPOSTA_INATIVA = new Set(["cancelada", "recusada"]);

export function buildImoveisComVisitaAgendada(visitas: Visita[]): Set<string> {
  const ids = new Set<string>();
  for (const visita of visitas) {
    if (!visita.imovel_id) continue;
    if (!VISITA_AGENDADA.includes(visita.status)) continue;
    ids.add(visita.imovel_id);
  }
  return ids;
}

export function buildImoveisComPropostaAtiva(propostas: Proposta[]): Set<string> {
  const ids = new Set<string>();
  for (const proposta of propostas) {
    if (!proposta.imovel_id) continue;
    if (PROPOSTA_INATIVA.has(proposta.status)) continue;
    ids.add(proposta.imovel_id);
  }
  return ids;
}

export function buildImoveisComNegocioFechado(negocios: Negocio[]): Set<string> {
  const ids = new Set<string>();
  for (const negocio of negocios) {
    if (!negocio.imovel_id) continue;
    if (negocio.status !== "fechado") continue;
    ids.add(negocio.imovel_id);
  }
  return ids;
}

export function getImovelWorkflowBadgeVariant(
  imovelId: string,
  maps: {
    visitas?: Set<string>;
    propostas?: Set<string>;
    negocios?: Set<string>;
  },
): ImovelWorkflowBadgeVariant | null {
  if (maps.negocios?.has(imovelId)) return "negocio_fechado";
  if (maps.propostas?.has(imovelId)) return "proposta";
  if (maps.visitas?.has(imovelId)) return "visita";
  return null;
}
