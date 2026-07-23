"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/constants/dashboard";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { logPostgrestError } from "@/lib/supabase/postgrest-error";
import { createClient } from "@/lib/supabase/server";
import type { DashboardConfig } from "@/types";

export type DashboardConfigActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

function buildFallbackDashboardConfig(corretorId: string): DashboardConfig {
  const now = new Date().toISOString();

  return {
    id: "fallback",
    corretor_id: corretorId,
    ...DEFAULT_DASHBOARD_CONFIG,
    criado_em: now,
    atualizado_em: now,
  };
}

async function fetchDashboardConfigRow(
  corretorId: string,
): Promise<DashboardConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_config")
    .select("*")
    .eq("corretor_id", corretorId)
    .maybeSingle();

  if (error) {
    logPostgrestError("getDashboardConfig", error);
    return null;
  }

  return (data as DashboardConfig | null) ?? null;
}

async function ensureDashboardConfigRow(
  corretorId: string,
): Promise<DashboardConfig | null> {
  const supabase = await createClient();

  const { data: upserted, error: upsertError } = await supabase
    .from("dashboard_config")
    .upsert(
      { corretor_id: corretorId, ...DEFAULT_DASHBOARD_CONFIG },
      { onConflict: "corretor_id", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();

  if (upsertError) {
    logPostgrestError("getDashboardConfig upsert", upsertError);
  } else if (upserted) {
    return upserted as DashboardConfig;
  }

  return fetchDashboardConfigRow(corretorId);
}

export const getDashboardConfig = cache(async (): Promise<DashboardConfig | null> => {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const existing = await fetchDashboardConfigRow(corretor.id);
  if (existing) {
    return existing;
  }

  const ensured = await ensureDashboardConfigRow(corretor.id);
  if (ensured) {
    return ensured;
  }

  return buildFallbackDashboardConfig(corretor.id);
});

export async function saveDashboardConfig(input: {
  leads_verde_dias: number;
  leads_amarelo_dias: number;
  imoveis_verde_dias: number;
  imoveis_amarelo_dias: number;
}): Promise<DashboardConfigActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) {
    return { error: "Corretor não encontrado." };
  }

  if (input.leads_verde_dias >= input.leads_amarelo_dias) {
    return { error: "Leads: dias verde deve ser menor que amarelo." };
  }

  if (input.imoveis_verde_dias >= input.imoveis_amarelo_dias) {
    return { error: "Imóveis: dias verde deve ser menor que amarelo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dashboard_config").upsert(
    {
      corretor_id: corretor.id,
      leads_verde_dias: input.leads_verde_dias,
      leads_amarelo_dias: input.leads_amarelo_dias,
      imoveis_verde_dias: input.imoveis_verde_dias,
      imoveis_amarelo_dias: input.imoveis_amarelo_dias,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "corretor_id" },
  );

  if (error) {
    logPostgrestError("saveDashboardConfig", error);
    return { error: "Não foi possível salvar a configuração." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracoes");

  return { success: true, message: "Configuração do dashboard salva." };
}
