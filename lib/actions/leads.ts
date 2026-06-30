"use server";

import { revalidatePath } from "next/cache";

import { ETAPAS_LEAD, isEtapaLead } from "@/lib/constants/leads";
import {
  mergeLeadObservacoesMeta,
  parseLeadObservacoes,
  serializeLeadObservacoes,
  type PerfilFinanceiroLead,
} from "@/lib/leads/observacoes";
import { getMidiasOrigem as getMidiasOrigemConfig } from "@/lib/actions/configuracoes";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type {
  EtapaLead,
  Lead,
  LeadInteracao,
  MidiaOrigem,
  TemperaturaLead,
  TipoInteracao,
} from "@/types";

export type LeadActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  leadId?: string;
};

export interface LeadsFilterParams {
  temperatura?: TemperaturaLead;
  etapa?: EtapaLead;
  origem?: string;
  finalidade_busca?: string;
  perfil_id?: string;
  sem_interacao_dias?: number;
  finalidade?: "compra" | "locacao";
  ativos_apenas?: boolean;
}

export interface CreateLeadInput {
  nome: string;
  telefone: string;
  email?: string;
  finalidade_busca?: string;
  tipo_imovel_busca?: string;
  bairros_interesse?: string[];
  quartos_minimo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  prazo_decisao?: string;
  midia_nome?: string;
  observacoes?: string;
  perfil_id?: string;
}

export interface UpdateLeadInput {
  nome?: string;
  telefone?: string;
  email?: string;
  finalidade_busca?: string;
  tipo_imovel_busca?: string;
  bairros_interesse?: string[];
  quartos_minimo?: number | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  prazo_decisao?: string | null;
  etapa?: EtapaLead;
  temperatura?: TemperaturaLead;
  observacoes?: string;
  perfil_id?: string | null;
  perfil_financeiro?: PerfilFinanceiroLead;
  qualificado?: boolean;
}

export interface PropostaInput {
  imovel_id: string;
  valor: number;
  status: string;
  observacoes?: string;
}

export interface InteracaoInput {
  tipo: TipoInteracao;
  descricao: string;
  data?: string;
}

function sanitizeTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

function mapMidiaToOrigem(midiaNome?: string): string {
  if (!midiaNome?.trim()) {
    return "manual";
  }

  const normalized = midiaNome.trim().toLowerCase();

  if (normalized.includes("whatsapp")) {
    return "whatsapp";
  }

  if (normalized.includes("site")) {
    return "site";
  }

  if (normalized.includes("indica")) {
    return "indicacao";
  }

  return midiaNome.trim();
}

function applyClientSideFilters(leads: Lead[], filters?: LeadsFilterParams): Lead[] {
  if (!filters) {
    return leads;
  }

  return leads.filter((lead) => {
    if (filters.ativos_apenas !== false) {
      if (lead.etapa === "fechado" || lead.etapa === "perdido") {
        return false;
      }
    }

    if (filters.temperatura && lead.temperatura !== filters.temperatura) {
      return false;
    }

    if (filters.etapa && lead.etapa !== filters.etapa) {
      return false;
    }

    if (filters.finalidade_busca && lead.finalidade_busca !== filters.finalidade_busca) {
      return false;
    }

    if (filters.finalidade && lead.finalidade_busca !== filters.finalidade) {
      return false;
    }

    if (filters.origem) {
      const origemMatch =
        lead.origem === filters.origem ||
        lead.origem.toLowerCase() === filters.origem.toLowerCase();
      if (!origemMatch) {
        return false;
      }
    }

    if (filters.perfil_id) {
      const { meta } = parseLeadObservacoes(lead.observacoes);
      if (meta.perfil_id !== filters.perfil_id) {
        return false;
      }
    }

    if (filters.sem_interacao_dias !== undefined && filters.sem_interacao_dias > 0) {
      const ultima =
        lead.ultima_mensagem_em ?? lead.atualizado_em ?? lead.criado_em;
      const limite = new Date();
      limite.setDate(limite.getDate() - filters.sem_interacao_dias);
      if (new Date(ultima) > limite) {
        return false;
      }
    }

    return true;
  });
}

export async function getMidiasOrigem(): Promise<MidiaOrigem[]> {
  return getMidiasOrigemConfig();
}

export async function getLeads(filters?: LeadsFilterParams): Promise<Lead[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*, imovel:imoveis(*)")
    .eq("corretor_id", corretor.id)
    .order("criado_em", { ascending: false });

  if (filters?.temperatura) {
    query = query.eq("temperatura", filters.temperatura);
  }

  if (filters?.etapa) {
    query = query.eq("etapa", filters.etapa);
  }

  if (filters?.finalidade_busca) {
    query = query.eq("finalidade_busca", filters.finalidade_busca);
  }

  if (filters?.finalidade) {
    query = query.eq("finalidade_busca", filters.finalidade);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getLeads] failed", error);
    return [];
  }

  const leads = (data ?? []) as Lead[];
  return applyClientSideFilters(leads, filters);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, imovel:imoveis(*), interacoes:lead_interacoes(*)")
    .eq("id", id)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (error || !data) {
    console.error("[getLeadById] failed", error);
    return null;
  }

  const lead = data as Lead;

  if (lead.interacoes) {
    lead.interacoes.sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    );
  }

  return lead;
}

export async function createLead(input: CreateLeadInput): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const nome = input.nome.trim();
  const telefone = input.telefone.trim();

  if (!nome) {
    return { error: "Informe o nome do lead." };
  }

  if (!telefone) {
    return { error: "Informe o telefone do lead." };
  }

  const observacoes = input.perfil_id
    ? mergeLeadObservacoesMeta(input.observacoes ?? null, {
        perfil_id: input.perfil_id,
      })
    : input.observacoes?.trim() || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      corretor_id: corretor.id,
      nome,
      telefone,
      email: input.email?.trim() || null,
      finalidade_busca: input.finalidade_busca || null,
      tipo_imovel_busca: input.tipo_imovel_busca?.trim() || null,
      bairros_interesse: input.bairros_interesse?.length
        ? input.bairros_interesse
        : null,
      quartos_minimo: input.quartos_minimo ?? null,
      valor_minimo: input.valor_minimo ?? null,
      valor_maximo: input.valor_maximo ?? null,
      prazo_decisao: input.prazo_decisao?.trim() || null,
      origem: mapMidiaToOrigem(input.midia_nome),
      etapa: "novo",
      temperatura: "morno",
      atendido_por: "corretor",
      observacoes,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createLead] failed", error);
    return { error: "Não foi possível criar o lead." };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return { success: true, leadId: data.id, message: "Lead criado com sucesso." };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (input.etapa && (!isEtapaLead(input.etapa) || !ETAPAS_LEAD.includes(input.etapa))) {
    return { error: "Etapa inválida." };
  }

  const supabase = await createClient();
  const { data: existente, error: buscaError } = await supabase
    .from("leads")
    .select("observacoes")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (buscaError || !existente) {
    return { error: "Lead não encontrado." };
  }

  const updatePayload: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
  };

  if (input.nome !== undefined) updatePayload.nome = input.nome.trim();
  if (input.telefone !== undefined) updatePayload.telefone = input.telefone.trim();
  if (input.email !== undefined) updatePayload.email = input.email.trim() || null;
  if (input.finalidade_busca !== undefined) {
    updatePayload.finalidade_busca = input.finalidade_busca || null;
  }
  if (input.tipo_imovel_busca !== undefined) {
    updatePayload.tipo_imovel_busca = input.tipo_imovel_busca.trim() || null;
  }
  if (input.bairros_interesse !== undefined) {
    updatePayload.bairros_interesse = input.bairros_interesse.length
      ? input.bairros_interesse
      : null;
  }
  if (input.quartos_minimo !== undefined) updatePayload.quartos_minimo = input.quartos_minimo;
  if (input.valor_minimo !== undefined) updatePayload.valor_minimo = input.valor_minimo;
  if (input.valor_maximo !== undefined) updatePayload.valor_maximo = input.valor_maximo;
  if (input.prazo_decisao !== undefined) {
    updatePayload.prazo_decisao = input.prazo_decisao?.trim() || null;
  }
  if (input.etapa !== undefined) updatePayload.etapa = input.etapa;
  if (input.temperatura !== undefined) updatePayload.temperatura = input.temperatura;

  if (input.qualificado !== undefined) {
    updatePayload.etapa = input.qualificado ? "qualificado" : "contato_feito";
  }

  let observacoesAtual = existente.observacoes as string | null;

  if (
    input.perfil_id !== undefined ||
    input.perfil_financeiro !== undefined ||
    input.observacoes !== undefined
  ) {
    const { meta, texto } = parseLeadObservacoes(observacoesAtual);

    if (input.perfil_id !== undefined) {
      meta.perfil_id = input.perfil_id;
    }

    if (input.perfil_financeiro !== undefined) {
      meta.perfil_financeiro = input.perfil_financeiro;
    }

    const novoTexto =
      input.observacoes !== undefined ? input.observacoes : texto;

    observacoesAtual = serializeLeadObservacoes(meta, novoTexto);
    updatePayload.observacoes = observacoesAtual;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (updateError) {
    console.error("[updateLead] failed", updateError);
    return { error: "Não foi possível atualizar o lead." };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Lead atualizado." };
}

export async function updateLeadEtapa(
  leadId: string,
  etapa: EtapaLead,
): Promise<LeadActionResult> {
  return updateLead(leadId, { etapa });
}

export async function addInteracao(
  leadId: string,
  input: InteracaoInput,
): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const descricao = input.descricao.trim();
  if (!descricao) {
    return { error: "Informe a descrição da interação." };
  }

  const supabase = await createClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (leadError || !lead) {
    return { error: "Lead não encontrado." };
  }

  const criadoEm = input.data ? new Date(input.data).toISOString() : new Date().toISOString();

  const { error } = await supabase.from("lead_interacoes").insert({
    lead_id: leadId,
    corretor_id: corretor.id,
    tipo: input.tipo,
    conteudo: descricao,
    de: "corretor",
    criado_em: criadoEm,
  });

  if (error) {
    console.error("[addInteracao] failed", error);
    return { error: "Não foi possível registrar a interação." };
  }

  await supabase
    .from("leads")
    .update({
      ultima_mensagem_em: criadoEm,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId);

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return { success: true, message: "Interação registrada." };
}

export async function registerProposta(
  leadId: string,
  input: PropostaInput,
): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (leadError || !lead) {
    return { error: "Lead não encontrado." };
  }

  const conteudo = JSON.stringify({
    imovel_id: input.imovel_id,
    valor: input.valor,
    status: input.status,
    observacoes: input.observacoes?.trim() || null,
  });

  const agora = new Date().toISOString();

  const { error } = await supabase.from("lead_interacoes").insert({
    lead_id: leadId,
    corretor_id: corretor.id,
    tipo: "proposta",
    conteudo,
    de: "corretor",
    criado_em: agora,
  });

  if (error) {
    console.error("[registerProposta] failed", error);
    return { error: "Não foi possível registrar a proposta." };
  }

  await supabase
    .from("leads")
    .update({
      etapa: "proposta",
      ultima_mensagem_em: agora,
      atualizado_em: agora,
    })
    .eq("id", leadId);

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return { success: true, message: "Proposta registrada." };
}

export async function linkImovel(
  leadId: string,
  imovelId: string,
): Promise<LeadActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();

  const { data: imovel, error: imovelError } = await supabase
    .from("imoveis")
    .select("id")
    .eq("id", imovelId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (imovelError || !imovel) {
    return { error: "Imóvel não encontrado." };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("observacoes, imovel_id")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (leadError || !lead) {
    return { error: "Lead não encontrado." };
  }

  const { meta } = parseLeadObservacoes(lead.observacoes as string | null);
  const indicados = new Set(meta.imoveis_indicados ?? []);

  if (lead.imovel_id) {
    indicados.add(lead.imovel_id);
  }

  indicados.add(imovelId);

  const observacoes = mergeLeadObservacoesMeta(lead.observacoes as string | null, {
    imoveis_indicados: Array.from(indicados),
  });

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      imovel_id: imovelId,
      observacoes,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("[linkImovel] failed", updateError);
    return { error: "Não foi possível vincular o imóvel." };
  }

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { success: true, message: "Imóvel indicado." };
}

export async function searchImoveisForLead(query: string) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("id, titulo, codigo, bairro, finalidade, status, valor_venda, valor_locacao")
    .eq("corretor_id", corretor.id)
    .or(
      `titulo.ilike.%${trimmed}%,codigo.ilike.%${trimmed}%,bairro.ilike.%${trimmed}%`,
    )
    .limit(10);

  if (error) {
    console.error("[searchImoveisForLead] failed", error);
    return [];
  }

  return data ?? [];
}

export async function getPerfisForLeads() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, ativo")
    .eq("corretor_id", corretor.id)
    .eq("ativo", true)
    .order("nome");

  if (error) {
    return [];
  }

  return data ?? [];
}
