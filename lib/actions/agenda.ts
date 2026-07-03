"use server";

import { revalidatePath } from "next/cache";

import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { Agenda, StatusAgenda, TipoAgenda } from "@/types";

export type AgendaActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  id?: string;
};

export interface AgendaFilterParams {
  inicio?: string;
  fim?: string;
  status?: StatusAgenda;
}

export async function getAgendaItems(filters?: AgendaFilterParams): Promise<Agenda[]> {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const supabase = await createClient();
  let query = supabase
    .from("agenda")
    .select("*, lead:leads(id, nome), imovel:imoveis(id, titulo, codigo)")
    .eq("corretor_id", corretor.id)
    .order("data_atividade", { ascending: true });

  if (filters?.inicio) {
    query = query.gte("data_atividade", filters.inicio);
  }
  if (filters?.fim) {
    query = query.lte("data_atividade", filters.fim);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getAgendaItems]", error);
    return [];
  }

  return (data ?? []) as Agenda[];
}

export async function getAgendaHoje(): Promise<Agenda[]> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  return getAgendaItems({
    inicio: hoje.toISOString(),
    fim: amanha.toISOString(),
    status: "pendente",
  });
}

export async function getVisitasProximas24h() {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const agora = new Date();
  const limite = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visitas")
    .select("*, lead:leads(id, nome), imovel:imoveis(id, titulo, codigo)")
    .eq("corretor_id", corretor.id)
    .eq("status", "agendada")
    .gte("data_visita", agora.toISOString())
    .lte("data_visita", limite.toISOString())
    .order("data_visita", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export interface CreateAgendaInput {
  tipo: TipoAgenda;
  titulo: string;
  descricao?: string;
  data_atividade: string;
  lead_id?: string;
  imovel_id?: string;
  perfil_id?: string;
  lembrete_email?: boolean;
}

export async function createAgendaItem(
  input: CreateAgendaInput,
): Promise<AgendaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const titulo = input.titulo.trim();
  if (!titulo) return { error: "Informe o título da atividade." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agenda")
    .insert({
      corretor_id: corretor.id,
      tipo: input.tipo,
      titulo,
      descricao: input.descricao?.trim() || null,
      data_atividade: new Date(input.data_atividade).toISOString(),
      lead_id: input.lead_id ?? null,
      imovel_id: input.imovel_id ?? null,
      perfil_id: input.perfil_id ?? null,
      lembrete_email: input.lembrete_email ?? false,
      status: "pendente",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createAgendaItem]", error);
    return { error: "Não foi possível criar a atividade." };
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { success: true, id: data.id, message: "Atividade criada." };
}

export async function updateAgendaStatus(
  agendaId: string,
  status: StatusAgenda,
): Promise<AgendaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agenda")
    .update({ status })
    .eq("id", agendaId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível atualizar a atividade." };

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { success: true, message: "Atividade atualizada." };
}

export async function deleteAgendaItem(agendaId: string): Promise<AgendaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agenda")
    .delete()
    .eq("id", agendaId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível excluir a atividade." };

  revalidatePath("/dashboard/agenda");
  return { success: true, message: "Atividade excluída." };
}

export async function getAgendaLembretesPendentes() {
  const agora = new Date();
  const limite = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agenda")
    .select("*, lead:leads(nome, email), corretor:corretores(nome, email)")
    .eq("status", "pendente")
    .eq("lembrete_email", true)
    .eq("lembrete_enviado", false)
    .gte("data_atividade", agora.toISOString())
    .lte("data_atividade", limite.toISOString());

  if (error) {
    console.error("[getAgendaLembretesPendentes]", error);
    return [];
  }

  return data ?? [];
}

export async function marcarLembreteEnviado(agendaId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("agenda")
    .update({ lembrete_enviado: true })
    .eq("id", agendaId);
}
