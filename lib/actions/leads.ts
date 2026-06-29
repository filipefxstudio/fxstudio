"use server";

import { revalidatePath } from "next/cache";

import { ETAPAS_LEAD, isEtapaLead } from "@/lib/constants/leads";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { EtapaLead, Lead } from "@/types";

export type LeadActionResult = {
  success?: boolean;
  error?: string;
};

export async function getLeads(): Promise<Lead[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, imovel:imoveis(*)")
    .eq("corretor_id", corretor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[getLeads] failed", error);
    return [];
  }

  return (data ?? []) as Lead[];
}

export async function updateLeadEtapa(
  leadId: string,
  etapa: EtapaLead,
): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (!isEtapaLead(etapa) || !ETAPAS_LEAD.includes(etapa)) {
    return { error: "Etapa inválida." };
  }

  const supabase = await createClient();
  const { data: leadExistente, error: buscaError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (buscaError || !leadExistente) {
    console.error("[updateLeadEtapa] lead not found", buscaError);
    return { error: "Lead não encontrado." };
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      etapa,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (updateError) {
    console.error("[updateLeadEtapa] failed", updateError);
    return { error: "Não foi possível atualizar a etapa do lead." };
  }

  revalidatePath("/dashboard/leads");
  return { success: true };
}
