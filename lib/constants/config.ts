export const STORAGE_KEY_LEADS_VIEW = "fx-leads-view";
export const STORAGE_KEY_ATENDIMENTOS_SORT = "fx-atendimentos-sort";
export type AtendimentosSortMode =
  | "recentes"
  | "antigos"
  | "nome_asc"
  | "nome_desc"
  | "etapa";

export function isAtendimentosSortMode(value: string): value is AtendimentosSortMode {
  return (
    value === "recentes" ||
    value === "antigos" ||
    value === "nome_asc" ||
    value === "nome_desc" ||
    value === "etapa"
  );
}
export const STORAGE_KEY_DIAS_ALERTA_INATIVIDADE = "fx-dias-alerta-inatividade";
export const DEFAULT_DIAS_ALERTA_INATIVIDADE = 7;
export const DIAS_LEAD_NOVO = 7;

export type LeadsViewMode = "lista" | "grade" | "kanban";

export function isLeadsViewMode(value: string): value is LeadsViewMode {
  return value === "lista" || value === "grade" || value === "kanban";
}
