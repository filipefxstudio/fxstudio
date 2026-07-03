"use server";

import { randomBytes } from "crypto";

import { revalidatePath } from "next/cache";

import { podeAvancarEtapa } from "@/lib/leads/etapa-order";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type {
  AuditoriaAtendimento,
  EtapaLead,
  Lead,
  LeadImovelSelecionado,
  Negocio,
  Proposta,
  StatusProposta,
  StatusVisita,
  Visita,
} from "@/types";

export type AtendimentoActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  id?: string;
  token?: string;
};

function revalidateAtendimentoPaths(leadId: string) {
  revalidatePath("/dashboard/atendimentos");
  revalidatePath(`/dashboard/atendimentos/${leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
}

export async function registrarAuditoria(
  leadId: string,
  acao: string,
  detalhes?: Record<string, unknown>,
  perfilId?: string | null,
): Promise<void> {
  const corretor = await getCorretorForUser();
  if (!corretor) return;

  const supabase = await createClient();
  await supabase.from("auditoria_atendimento").insert({
    lead_id: leadId,
    corretor_id: corretor.id,
    perfil_id: perfilId ?? null,
    acao,
    detalhes: detalhes ?? null,
  });
}

async function avancarEtapaLead(
  leadId: string,
  novaEtapa: EtapaLead,
  supabase: Awaited<ReturnType<typeof createClient>>,
  corretorId: string,
): Promise<void> {
  const { data: lead } = await supabase
    .from("leads")
    .select("etapa")
    .eq("id", leadId)
    .eq("corretor_id", corretorId)
    .maybeSingle();

  if (!lead) return;

  const etapaAtual = lead.etapa as EtapaLead;
  if (!podeAvancarEtapa(etapaAtual, novaEtapa)) return;

  await supabase
    .from("leads")
    .update({
      etapa: novaEtapa,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("corretor_id", corretorId);
}

async function criarAgendaFutura(input: {
  corretorId: string;
  leadId: string;
  imovelId?: string | null;
  visitaId?: string | null;
  perfilId?: string | null;
  tipo: string;
  titulo: string;
  descricao?: string;
  dataAtividade: string;
  lembreteEmail?: boolean;
}): Promise<void> {
  const dataAtividade = new Date(input.dataAtividade);
  if (dataAtividade <= new Date()) return;

  const supabase = await createClient();
  await supabase.from("agenda").insert({
    corretor_id: input.corretorId,
    lead_id: input.leadId,
    imovel_id: input.imovelId ?? null,
    visita_id: input.visitaId ?? null,
    perfil_id: input.perfilId ?? null,
    tipo: input.tipo,
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    data_atividade: dataAtividade.toISOString(),
    lembrete_email: input.lembreteEmail ?? false,
    status: "pendente",
  });
}

export async function getAtendimentoCompleto(leadId: string) {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const supabase = await createClient();

  const [leadRes, visitasRes, propostasRes, negociosRes, selecionadosRes, auditoriaRes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*, imovel:imoveis(*), interacoes:lead_interacoes(*)")
        .eq("id", leadId)
        .eq("corretor_id", corretor.id)
        .maybeSingle(),
      supabase
        .from("visitas")
        .select("*, imovel:imoveis(id, titulo, codigo, bairro, finalidade, status)")
        .eq("lead_id", leadId)
        .eq("corretor_id", corretor.id)
        .order("data_visita", { ascending: false }),
      supabase
        .from("propostas")
        .select("*, imovel:imoveis(id, titulo, codigo, bairro, finalidade, status)")
        .eq("lead_id", leadId)
        .eq("corretor_id", corretor.id)
        .order("data_proposta", { ascending: false }),
      supabase
        .from("negocios")
        .select("*, imovel:imoveis(id, titulo, codigo, bairro, finalidade, status)")
        .eq("lead_id", leadId)
        .eq("corretor_id", corretor.id)
        .order("data_fechamento", { ascending: false }),
      supabase
        .from("lead_imoveis_selecionados")
        .select("*, imovel:imoveis(*, fotos:imovel_fotos(*))")
        .eq("lead_id", leadId)
        .eq("corretor_id", corretor.id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("auditoria_atendimento")
        .select("*")
        .eq("lead_id", leadId)
        .eq("corretor_id", corretor.id)
        .order("criado_em", { ascending: false }),
    ]);

  if (leadRes.error || !leadRes.data) return null;

  const lead = leadRes.data as Lead;
  if (lead.interacoes) {
    lead.interacoes.sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    );
  }

  return {
    lead,
    visitas: (visitasRes.data ?? []) as Visita[],
    propostas: (propostasRes.data ?? []) as Proposta[],
    negocios: (negociosRes.data ?? []) as Negocio[],
    imoveisSelecionados: (selecionadosRes.data ?? []) as LeadImovelSelecionado[],
    auditoria: (auditoriaRes.data ?? []) as AuditoriaAtendimento[],
  };
}

export interface CreateVisitaInput {
  imovel_id: string;
  perfil_id?: string;
  data_visita: string;
  status?: StatusVisita;
  observacoes?: string;
  lembrete_email?: boolean;
}

export async function createVisita(
  leadId: string,
  input: CreateVisitaInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (leadError || !lead) return { error: "Atendimento não encontrado." };

  const { data, error } = await supabase
    .from("visitas")
    .insert({
      corretor_id: corretor.id,
      lead_id: leadId,
      imovel_id: input.imovel_id,
      perfil_id: input.perfil_id ?? null,
      data_visita: new Date(input.data_visita).toISOString(),
      status: input.status ?? "agendada",
      observacoes: input.observacoes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createVisita]", error);
    return { error: "Não foi possível agendar a visita." };
  }

  await criarAgendaFutura({
    corretorId: corretor.id,
    leadId,
    imovelId: input.imovel_id,
    visitaId: data.id,
    perfilId: input.perfil_id,
    tipo: "visita",
    titulo: "Visita agendada",
    descricao: input.observacoes,
    dataAtividade: input.data_visita,
    lembreteEmail: input.lembrete_email,
  });

  await registrarAuditoria(leadId, "visita_agendada", {
    visita_id: data.id,
    imovel_id: input.imovel_id,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, id: data.id, message: "Visita agendada." };
}

export interface UpdateVisitaInput {
  status?: StatusVisita;
  parecer?: string;
  vai_gerar_proposta?: string;
  observacoes?: string;
  data_visita?: string;
}

export async function updateVisita(
  visitaId: string,
  input: UpdateVisitaInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: visita, error: buscaError } = await supabase
    .from("visitas")
    .select("id, lead_id, status")
    .eq("id", visitaId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (buscaError || !visita) return { error: "Visita não encontrada." };

  const payload: Record<string, unknown> = {};
  if (input.status) payload.status = input.status;
  if (input.parecer !== undefined) payload.parecer = input.parecer || null;
  if (input.vai_gerar_proposta !== undefined) {
    payload.vai_gerar_proposta = input.vai_gerar_proposta || null;
  }
  if (input.observacoes !== undefined) payload.observacoes = input.observacoes.trim() || null;
  if (input.data_visita) payload.data_visita = new Date(input.data_visita).toISOString();

  const { error } = await supabase.from("visitas").update(payload).eq("id", visitaId);

  if (error) {
    console.error("[updateVisita]", error);
    return { error: "Não foi possível atualizar a visita." };
  }

  const leadId = visita.lead_id as string;

  if (input.status === "realizada") {
    await avancarEtapaLead(leadId, "visita_agendada", supabase, corretor.id);
    await registrarAuditoria(leadId, "visita_realizada", { visita_id: visitaId });
  } else {
    await registrarAuditoria(leadId, "visita_atualizada", {
      visita_id: visitaId,
      ...payload,
    });
  }

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Visita atualizada." };
}

export interface CreatePropostaInput {
  imovel_id: string;
  perfil_id?: string;
  valor_proposto: number;
  data_proposta: string;
  status?: StatusProposta;
  observacoes?: string;
}

export async function createProposta(
  leadId: string,
  input: CreatePropostaInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const status = input.status ?? "em_analise";

  const { data, error } = await supabase
    .from("propostas")
    .insert({
      corretor_id: corretor.id,
      lead_id: leadId,
      imovel_id: input.imovel_id,
      perfil_id: input.perfil_id ?? null,
      valor_proposto: input.valor_proposto,
      data_proposta: input.data_proposta,
      status,
      observacoes: input.observacoes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createProposta]", error);
    return { error: "Não foi possível registrar a proposta." };
  }

  if (status !== "cancelada") {
    await avancarEtapaLead(leadId, "proposta", supabase, corretor.id);
  }

  if (status === "recusada") {
    await avancarEtapaLead(leadId, "perdido", supabase, corretor.id);
  }

  await registrarAuditoria(leadId, "proposta_registrada", {
    proposta_id: data.id,
    status,
    valor: input.valor_proposto,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, id: data.id, message: "Proposta registrada." };
}

export async function updatePropostaStatus(
  propostaId: string,
  status: StatusProposta,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: proposta, error: buscaError } = await supabase
    .from("propostas")
    .select("id, lead_id")
    .eq("id", propostaId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (buscaError || !proposta) return { error: "Proposta não encontrada." };

  const { error } = await supabase
    .from("propostas")
    .update({ status })
    .eq("id", propostaId);

  if (error) return { error: "Não foi possível atualizar a proposta." };

  const leadId = proposta.lead_id as string;

  if (status === "recusada") {
    await avancarEtapaLead(leadId, "perdido", supabase, corretor.id);
  } else if (status !== "cancelada") {
    await avancarEtapaLead(leadId, "proposta", supabase, corretor.id);
  }

  await registrarAuditoria(
    leadId,
    status === "cancelada" ? "proposta_cancelada" : "proposta_status_alterado",
    { proposta_id: propostaId, status },
  );

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Status da proposta atualizado." };
}

export interface CreateNegocioInput {
  imovel_id: string;
  proposta_id?: string;
  perfil_id?: string;
  valor_fechamento: number;
  valor_comissao?: number;
  percentual_comissao?: number;
  data_fechamento: string;
  data_prevista_comissao?: string;
  forma_pagamento?: string;
  observacoes?: string;
}

export async function createNegocio(
  leadId: string,
  input: CreateNegocioInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("negocios")
    .insert({
      corretor_id: corretor.id,
      lead_id: leadId,
      imovel_id: input.imovel_id,
      proposta_id: input.proposta_id ?? null,
      perfil_id: input.perfil_id ?? null,
      valor_fechamento: input.valor_fechamento,
      valor_comissao: input.valor_comissao ?? null,
      percentual_comissao: input.percentual_comissao ?? null,
      data_fechamento: input.data_fechamento,
      data_prevista_comissao: input.data_prevista_comissao ?? null,
      forma_pagamento: input.forma_pagamento ?? null,
      observacoes: input.observacoes?.trim() || null,
      status: "fechado",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createNegocio]", error);
    return { error: "Não foi possível registrar o negócio." };
  }

  await avancarEtapaLead(leadId, "fechado", supabase, corretor.id);
  await registrarAuditoria(leadId, "negocio_fechado", {
    negocio_id: data.id,
    valor: input.valor_fechamento,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, id: data.id, message: "Negócio fechado registrado." };
}

export async function selecionarImovel(
  leadId: string,
  imovelId: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const token = randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("lead_imoveis_selecionados")
    .upsert(
      {
        lead_id: leadId,
        imovel_id: imovelId,
        corretor_id: corretor.id,
        token_compartilhamento: token,
      },
      { onConflict: "lead_id,imovel_id" },
    )
    .select("token_compartilhamento")
    .single();

  if (error || !data) {
    console.error("[selecionarImovel]", error);
    return { error: "Não foi possível selecionar o imóvel." };
  }

  await registrarAuditoria(leadId, "imovel_selecionado", { imovel_id: imovelId });

  revalidateAtendimentoPaths(leadId);
  return {
    success: true,
    token: data.token_compartilhamento as string,
    message: "Imóvel adicionado à seleção.",
  };
}

export async function removerImovelSelecionado(
  leadId: string,
  imovelId: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_imoveis_selecionados")
    .delete()
    .eq("lead_id", leadId)
    .eq("imovel_id", imovelId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível remover o imóvel." };

  await registrarAuditoria(leadId, "imovel_removido_selecao", { imovel_id: imovelId });
  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Imóvel removido da seleção." };
}

export async function qualificarLead(leadId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  await avancarEtapaLead(leadId, "qualificado", supabase, corretor.id);
  await registrarAuditoria(leadId, "lead_qualificado", {});

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Lead qualificado." };
}

export async function marcarContatoFeito(leadId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  await avancarEtapaLead(leadId, "contato_feito", supabase, corretor.id);
  await registrarAuditoria(leadId, "contato_feito", {});

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Contato registrado." };
}

export async function getImoveisIndicados(lead: Lead) {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const { meta } = parseLeadObservacoes(lead.observacoes);
  const ids = new Set<string>();
  if (lead.imovel_id) ids.add(lead.imovel_id);
  for (const id of meta.imoveis_indicados ?? []) ids.add(id);

  if (ids.size === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("imoveis")
    .select("*, fotos:imovel_fotos(*)")
    .eq("corretor_id", corretor.id)
    .in("id", Array.from(ids));

  return data ?? [];
}

export async function indicarImovelComAuditoria(
  leadId: string,
  imovelId: string,
): Promise<AtendimentoActionResult> {
  const { linkImovel } = await import("@/lib/actions/leads");
  const result = await linkImovel(leadId, imovelId);
  if (result.success) {
    await registrarAuditoria(leadId, "imovel_indicado", { imovel_id: imovelId });
    revalidateAtendimentoPaths(leadId);
  }
  return result;
}

export async function addInteracaoFutura(
  leadId: string,
  input: { tipo: string; descricao: string; data: string; titulo?: string },
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const dataAtividade = new Date(input.data);
  if (dataAtividade > new Date()) {
    await criarAgendaFutura({
      corretorId: corretor.id,
      leadId,
      tipo: input.tipo,
      titulo: input.titulo ?? input.tipo,
      descricao: input.descricao,
      dataAtividade: input.data,
    });
    await registrarAuditoria(leadId, "agenda_criada", { tipo: input.tipo });
    revalidateAtendimentoPaths(leadId);
    return { success: true, message: "Atividade agendada." };
  }

  const { addInteracao } = await import("@/lib/actions/leads");
  return addInteracao(leadId, {
    tipo: input.tipo as "anotacao",
    descricao: input.descricao,
    data: input.data,
  });
}
