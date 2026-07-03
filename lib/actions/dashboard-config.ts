"use server";

import { revalidatePath } from "next/cache";

import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/constants/dashboard";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { DashboardConfig } from "@/types";

export type DashboardConfigActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function getDashboardConfig(): Promise<DashboardConfig | null> {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_config")
    .select("*")
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (error) {
    console.error("[getDashboardConfig]", error);
    return null;
  }

  if (data) {
    return data as DashboardConfig;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("dashboard_config")
    .insert({ corretor_id: corretor.id, ...DEFAULT_DASHBOARD_CONFIG })
    .select("*")
    .single();

  if (insertError) {
    console.error("[getDashboardConfig insert]", insertError);
    return null;
  }

  return inserted as DashboardConfig;
}

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
    console.error("[saveDashboardConfig]", error);
    return { error: "Não foi possível salvar a configuração." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracoes");

  return { success: true, message: "Configuração do dashboard salva." };
}
