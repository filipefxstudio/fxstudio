import type { DashboardConfig } from "@/types";

export const DEFAULT_DASHBOARD_CONFIG: Omit<
  DashboardConfig,
  "id" | "corretor_id" | "criado_em" | "atualizado_em"
> = {
  leads_verde_dias: 5,
  leads_amarelo_dias: 10,
  imoveis_verde_dias: 30,
  imoveis_amarelo_dias: 45,
};
