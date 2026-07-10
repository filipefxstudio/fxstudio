"use server";

import { randomBytes } from "crypto";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_FICHA_VISITA_TEXTO,
  DEFAULT_MOTIVOS_DESCARTE,
} from "@/lib/constants/atendimentos";
import { formatCurrency } from "@/lib/imoveis/format";
import { podeAvancarEtapa } from "@/lib/leads/etapa-order";
import { parseLeadObservacoes } from "@/lib/leads/observacoes";
import { atualizarStatusImovelAutomatico } from "@/lib/actions/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { getPerfilForUser } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import type {
  AtendimentoConfig,
  AuditoriaAtendimento,
  EtapaLead,
  Imovel,
  Lead,
  LeadImovelSelecionado,
  MotivoDescarte,
  Negocio,
  Proposta,
  SituacaoLead,
  StatusProposta,
  StatusVisita,
  TemperaturaLead,
  TipoInteracao,
  Visita,
} from "@/types";

export type AtendimentoActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  id?: string;
  token?: string;
  html?: string;
};

type OrigemInteracao = "usuario" | "sistema";

function revalidateAtendimentoPaths(leadId: string) {
  revalidatePath("/dashboard/atendimentos");
  revalidatePath(`/dashboard/atendimentos/${leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
}

async function getLeadPerfilId(lead: { perfil_id?: string | null; observacoes?: string | null }) {
  if (lead.perfil_id) return lead.perfil_id;
  const { meta } = parseLeadObservacoes(lead.observacoes);
  return meta.perfil_id ?? null;
}

export async function gerarCodigoAtendimento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  corretorId: string,
): Promise<string> {
  const { data } = await supabase
    .from("leads")
    .select("codigo_atendimento")
    .eq("corretor_id", corretorId)
    .not("codigo_atendimento", "is", null)
    .order("codigo_atendimento", { ascending: false })
    .limit(1);

  let next = 1;
  const ultimo = data?.[0]?.codigo_atendimento as string | undefined;
  if (ultimo) {
    const match = ultimo.match(/ATD-(\d+)/);
    if (match) next = parseInt(match[1], 10) + 1;
  }

  return `ATD-${String(next).padStart(4, "0")}`;
}

export async function registrarInteracao(
  leadId: string,
  tipo: TipoInteracao,
  descricao: string,
  options?: { origem?: OrigemInteracao; data?: string },
): Promise<void> {
  const origem = options?.origem ?? "usuario";

  const { addInteracao } = await import("@/lib/actions/leads");
  await addInteracao(leadId, {
    tipo,
    descricao,
    data: options?.data,
    contarPrimeiraResposta: origem === "usuario",
  });
}

export async function registrarAuditoria(
  leadId: string,
  acao: string,
  detalhes?: Record<string, unknown>,
  perfilId?: string | null,
): Promise<void> {
  const corretor = await getCorretorForUser();
  if (!corretor) return;

  const perfil = perfilId === undefined ? await getPerfilForUser() : null;
  const supabase = await createClient();
  await supabase.from("auditoria_atendimento").insert({
    lead_id: leadId,
    corretor_id: corretor.id,
    perfil_id: perfilId ?? perfil?.id ?? null,
    acao,
    detalhes: detalhes ?? null,
  });
}

async function avancarEtapaLead(
  leadId: string,
  novaEtapa: EtapaLead,
  supabase: Awaited<ReturnType<typeof createClient>>,
  corretorId: string,
  registrarAuto = true,
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

  if (registrarAuto && novaEtapa !== etapaAtual) {
    await registrarInteracao(
      leadId,
      "anotacao",
      `Etapa avançada para ${novaEtapa.replace(/_/g, " ")}.`,
      { origem: "sistema" },
    );
  }
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

export interface CreateAtendimentoInput {
  nome: string;
  telefone: string;
  email?: string;
  midia_nome?: string;
  perfil_id?: string;
  imovel_id?: string;
  finalidade_busca?: string;
  tipo_imovel_busca?: string;
  bairros_interesse?: string[];
  quartos_minimo?: number;
  suites_minimas?: number;
  banheiros_minimos?: number;
  vagas_minimas?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  observacoes?: string;
}

function mapMidiaToOrigem(midiaNome?: string): string {
  if (!midiaNome?.trim()) return "manual";
  const normalized = midiaNome.trim().toLowerCase();
  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("site")) return "site";
  if (normalized.includes("indica")) return "indicacao";
  return midiaNome.trim();
}

async function garantirImovelInteresseSelecionado(
  leadId: string,
  imovelId: string,
  corretorId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { data: existente } = await supabase
    .from("lead_imoveis_selecionados")
    .select("id, interesse_inicial")
    .eq("lead_id", leadId)
    .eq("imovel_id", imovelId)
    .eq("corretor_id", corretorId)
    .maybeSingle();

  if (existente) {
    if (!existente.interesse_inicial) {
      await supabase
        .from("lead_imoveis_selecionados")
        .update({ interesse_inicial: true })
        .eq("id", existente.id);
    }
    return;
  }

  await supabase.from("lead_imoveis_selecionados").insert({
    lead_id: leadId,
    imovel_id: imovelId,
    corretor_id: corretorId,
    interesse_inicial: true,
    token_compartilhamento: randomBytes(16).toString("hex"),
  });
}

function leadTemFiltrosRadar(lead: {
  finalidade_busca?: string | null;
  tipo_imovel_busca?: string | null;
  bairros_interesse?: string[] | null;
  quartos_minimo?: number | null;
  suites_minimas?: number | null;
  banheiros_minimos?: number | null;
  vagas_minimas?: number | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
}): boolean {
  return Boolean(
    lead.finalidade_busca ||
      lead.tipo_imovel_busca ||
      lead.bairros_interesse?.length ||
      lead.quartos_minimo ||
      lead.suites_minimas ||
      lead.banheiros_minimos ||
      lead.vagas_minimas ||
      lead.valor_minimo != null ||
      lead.valor_maximo != null,
  );
}

export async function podeExcluirAtendimento(): Promise<boolean> {
  const perfil = await getPerfilForUser();
  return perfil?.papel === "admin";
}

export async function excluirAtendimento(
  leadId: string,
  motivo: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  const perfil = await getPerfilForUser();
  if (!corretor) return { error: "Sessão expirada." };
  if (perfil?.papel !== "admin") return { error: "Sem permissão para excluir." };

  const motivoTrim = motivo.trim();
  if (!motivoTrim) return { error: "Informe o motivo da exclusão." };

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, codigo_atendimento, nome")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!lead) return { error: "Atendimento não encontrado." };

  await registrarAuditoria(leadId, "atendimento_excluido", {
    motivo: motivoTrim,
    codigo: lead.codigo_atendimento,
    nome: lead.nome,
  });

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível excluir o atendimento." };

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Atendimento excluído." };
}

export async function createAtendimento(
  input: CreateAtendimentoInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  if (!nome) return { error: "Informe o nome." };
  if (!telefone) return { error: "Informe o telefone." };

  const perfil = await getPerfilForUser();
  const perfilId = input.perfil_id ?? perfil?.id ?? null;

  const supabase = await createClient();
  const codigo = await gerarCodigoAtendimento(supabase, corretor.id);
  const agora = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      corretor_id: corretor.id,
      nome,
      telefone,
      email: input.email?.trim() || null,
      imovel_id: input.imovel_id ?? null,
      perfil_id: perfilId,
      codigo_atendimento: codigo,
      situacao: "em_atendimento",
      finalidade_busca: input.finalidade_busca || null,
      tipo_imovel_busca: input.tipo_imovel_busca?.trim() || null,
      bairros_interesse: input.bairros_interesse?.length ? input.bairros_interesse : null,
      quartos_minimo: input.quartos_minimo ?? null,
      suites_minimas: input.suites_minimas ?? null,
      banheiros_minimos: input.banheiros_minimos ?? null,
      vagas_minimas: input.vagas_minimas ?? null,
      valor_minimo: input.valor_minimo ?? null,
      valor_maximo: input.valor_maximo ?? null,
      origem: mapMidiaToOrigem(input.midia_nome),
      etapa: "novo",
      temperatura: "indefinido",
      atendido_por: "corretor",
      data_entrada: agora,
      observacoes: input.observacoes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createAtendimento]", error);
    return { error: "Não foi possível criar o atendimento." };
  }

  await registrarInteracao(
    data.id,
    "anotacao",
    `Atendimento ${codigo} criado.`,
    { origem: "sistema" },
  );
  await registrarAuditoria(data.id, "atendimento_criado", { codigo });

  if (input.imovel_id) {
    await garantirImovelInteresseSelecionado(
      data.id,
      input.imovel_id,
      corretor.id,
      supabase,
    );
  }

  revalidateAtendimentoPaths(data.id);
  return { success: true, id: data.id, message: `Atendimento ${codigo} criado.` };
}

export async function getAtendimentoCompleto(leadId: string) {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const supabase = await createClient();

  const [leadRes, visitasRes, propostasRes, negociosRes, selecionadosRes, auditoriaRes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*, imovel:imoveis!leads_imovel_id_fkey(*), perfil:perfis(id, nome, email, papel), interacoes:lead_interacoes(*)")
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
        .select("*, imovel:imoveis(id, titulo, codigo, bairro, finalidade, status, captador_id, captador:perfis(id, nome)), perfil:perfis(id, nome)")
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
        .select("*, perfil:perfis(id, nome)")
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

  if (lead.imovel_id) {
    await garantirImovelInteresseSelecionado(
      leadId,
      lead.imovel_id,
      corretor.id,
      supabase,
    );
    const { data: refreshed } = await supabase
      .from("lead_imoveis_selecionados")
      .select("*, imovel:imoveis(*, fotos:imovel_fotos(*))")
      .eq("lead_id", leadId)
      .eq("corretor_id", corretor.id)
      .order("criado_em", { ascending: false });
    if (refreshed) {
      return {
        lead,
        visitas: (visitasRes.data ?? []) as Visita[],
        propostas: (propostasRes.data ?? []) as Proposta[],
        negocios: (negociosRes.data ?? []) as Negocio[],
        imoveisSelecionados: refreshed as LeadImovelSelecionado[],
        auditoria: (auditoriaRes.data ?? []) as AuditoriaAtendimento[],
      };
    }
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

export interface UpdateAtendimentoDadosInput {
  temperatura?: TemperaturaLead;
  etapa?: EtapaLead;
  situacao?: SituacaoLead;
  finalidade_busca?: string;
  tipo_imovel_busca?: string;
  bairros_interesse?: string[];
  quartos_minimo?: number | null;
  suites_minimas?: number | null;
  banheiros_minimos?: number | null;
  vagas_minimas?: number | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  prazo_decisao?: string | null;
  imovel_id?: string | null;
  entrada_fgts?: number | null;
  entrada_recursos_proprios?: number | null;
  financiamento_aprovado?: boolean;
  possui_imovel_venda?: boolean;
  interesse_permuta?: boolean;
  info_permuta?: string | null;
  obs_financeiras?: string | null;
  observacoes?: string | null;
}

export async function updateAtendimentoDados(
  leadId: string,
  input: UpdateAtendimentoDadosInput,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
  };

  if (input.temperatura !== undefined) payload.temperatura = input.temperatura;
  if (input.situacao !== undefined) payload.situacao = input.situacao;
  if (input.finalidade_busca !== undefined) payload.finalidade_busca = input.finalidade_busca || null;
  if (input.tipo_imovel_busca !== undefined) {
    payload.tipo_imovel_busca = input.tipo_imovel_busca?.trim() || null;
  }
  if (input.bairros_interesse !== undefined) {
    payload.bairros_interesse = input.bairros_interesse.length ? input.bairros_interesse : null;
  }
  if (input.quartos_minimo !== undefined) payload.quartos_minimo = input.quartos_minimo;
  if (input.suites_minimas !== undefined) payload.suites_minimas = input.suites_minimas;
  if (input.banheiros_minimos !== undefined) payload.banheiros_minimos = input.banheiros_minimos;
  if (input.vagas_minimas !== undefined) payload.vagas_minimas = input.vagas_minimas;
  if (input.valor_minimo !== undefined) payload.valor_minimo = input.valor_minimo;
  if (input.valor_maximo !== undefined) payload.valor_maximo = input.valor_maximo;
  if (input.prazo_decisao !== undefined) payload.prazo_decisao = input.prazo_decisao?.trim() || null;
  if (input.imovel_id !== undefined) payload.imovel_id = input.imovel_id;
  if (input.entrada_fgts !== undefined) payload.entrada_fgts = input.entrada_fgts;
  if (input.entrada_recursos_proprios !== undefined) {
    payload.entrada_recursos_proprios = input.entrada_recursos_proprios;
  }
  if (input.financiamento_aprovado !== undefined) {
    payload.financiamento_aprovado = input.financiamento_aprovado;
  }
  if (input.possui_imovel_venda !== undefined) payload.possui_imovel_venda = input.possui_imovel_venda;
  if (input.interesse_permuta !== undefined) payload.interesse_permuta = input.interesse_permuta;
  if (input.info_permuta !== undefined) payload.info_permuta = input.info_permuta?.trim() || null;
  if (input.obs_financeiras !== undefined) payload.obs_financeiras = input.obs_financeiras?.trim() || null;
  if (input.observacoes !== undefined) payload.observacoes = input.observacoes?.trim() || null;

  if (input.etapa !== undefined) {
    const { data: atual } = await supabase
      .from("leads")
      .select("etapa")
      .eq("id", leadId)
      .eq("corretor_id", corretor.id)
      .maybeSingle();
    const etapaAtual = (atual?.etapa ?? "novo") as EtapaLead;
    if (!podeAvancarEtapa(etapaAtual, input.etapa)) {
      return { error: "Não é possível retroceder a etapa." };
    }
    payload.etapa = input.etapa;
  }

  const { error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível salvar." };

  if (input.imovel_id !== undefined && input.imovel_id) {
    await garantirImovelInteresseSelecionado(
      leadId,
      input.imovel_id,
      corretor.id,
      supabase,
    );
  }

  await registrarAuditoria(leadId, "dados_atualizados", { campos: Object.keys(input) });
  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Dados salvos." };
}

export async function descartarAtendimento(
  leadId: string,
  motivoId: string,
  observacao?: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: motivo } = await supabase
    .from("motivos_descarte")
    .select("nome")
    .eq("id", motivoId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!motivo) return { error: "Motivo não encontrado." };

  const { error } = await supabase
    .from("leads")
    .update({
      situacao: "descartado",
      etapa: "perdido",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível descartar." };

  const msg = observacao?.trim()
    ? `Atendimento descartado: ${motivo.nome}. ${observacao.trim()}`
    : `Atendimento descartado: ${motivo.nome}.`;

  await registrarInteracao(leadId, "anotacao", msg);
  await registrarAuditoria(leadId, "atendimento_descartado", {
    motivo_id: motivoId,
    motivo: motivo.nome,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Atendimento descartado." };
}

export async function transferirAtendimento(
  leadId: string,
  novoPerfilId: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  const perfilAtual = await getPerfilForUser();
  if (!corretor) return { error: "Sessão expirada." };
  if (!perfilAtual || (perfilAtual.papel !== "admin" && perfilAtual.papel !== "gerente")) {
    return { error: "Sem permissão para transferir." };
  }

  const supabase = await createClient();
  const { data: destino } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("id", novoPerfilId)
    .eq("corretor_id", corretor.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!destino) return { error: "Responsável não encontrado." };

  const agora = new Date().toISOString();

  const { error } = await supabase
    .from("leads")
    .update({
      perfil_id: novoPerfilId,
      data_entrada: agora,
      tempo_primeira_resposta_min: null,
      atualizado_em: agora,
    })
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível transferir." };

  await registrarInteracao(
    leadId,
    "anotacao",
    `Atendimento transferido para ${destino.nome}.`,
  );
  await registrarAuditoria(leadId, "atendimento_transferido", {
    perfil_id: novoPerfilId,
    perfil_nome: destino.nome,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: `Transferido para ${destino.nome}.` };
}

export async function getImoveisRadar(leadId: string): Promise<Imovel[]> {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!lead) return [];

  let query = supabase
    .from("imoveis")
    .select("*, fotos:imovel_fotos(*), captador:perfis(id, nome)")
    .eq("corretor_id", corretor.id)
    .eq("status", "disponivel")
    .eq("status_aprovacao", "aprovado");

  const aplicarFiltros = leadTemFiltrosRadar(lead);

  if (aplicarFiltros) {
    if (lead.finalidade_busca === "compra") {
      query = query.eq("finalidade", "venda");
    } else if (lead.finalidade_busca === "locacao") {
      query = query.eq("finalidade", "locacao");
    }

    if (lead.tipo_imovel_busca) {
      query = query.eq("tipo", lead.tipo_imovel_busca);
    }

    if (lead.quartos_minimo) {
      query = query.gte("quartos", lead.quartos_minimo);
    }
    if (lead.suites_minimas) {
      query = query.gte("suites", lead.suites_minimas);
    }
    if (lead.banheiros_minimos) {
      query = query.gte("banheiros", lead.banheiros_minimos);
    }
    if (lead.vagas_minimas) {
      query = query.gte("vagas", lead.vagas_minimas);
    }
  }

  const { data } = await query.order("atualizado_em", { ascending: false }).limit(50);

  let imoveis = (data ?? []) as Imovel[];

  if (aplicarFiltros && lead.bairros_interesse?.length) {
    const bairros = lead.bairros_interesse.map((b: string) => b.toLowerCase());
    imoveis = imoveis.filter((i) =>
      bairros.some((b: string) => i.bairro?.toLowerCase().includes(b)),
    );
  }

  if (aplicarFiltros && (lead.valor_minimo != null || lead.valor_maximo != null)) {
    imoveis = imoveis.filter((i) => {
      const valor = i.finalidade === "venda" ? i.valor_venda : i.valor_locacao;
      if (valor == null) return false;
      if (lead.valor_minimo != null && valor < lead.valor_minimo) return false;
      if (lead.valor_maximo != null && valor > lead.valor_maximo) return false;
      return true;
    });
  }

  return imoveis;
}

export async function calcularFaixaValorImovel(
  imovelId: string,
): Promise<{ min: number; max: number } | null> {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const config = await getAtendimentoConfig();
  const percent = config?.faixa_valor_percent ?? 20;

  const supabase = await createClient();
  const { data: imovel } = await supabase
    .from("imoveis")
    .select("valor_venda, valor_locacao, finalidade")
    .eq("id", imovelId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!imovel) return null;

  const valor =
    imovel.finalidade === "venda" ? imovel.valor_venda : imovel.valor_locacao;
  if (valor == null) return null;

  const delta = valor * (percent / 100);
  return { min: Math.round(valor - delta), max: Math.round(valor + delta) };
}

export async function getAtendimentoConfig(): Promise<AtendimentoConfig | null> {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("atendimento_config")
    .select("*")
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (data) return data as AtendimentoConfig;

  const { data: created } = await supabase
    .from("atendimento_config")
    .insert({
      corretor_id: corretor.id,
      faixa_valor_percent: 20,
      ficha_visita_texto: DEFAULT_FICHA_VISITA_TEXTO,
    })
    .select("*")
    .single();

  return (created as AtendimentoConfig) ?? null;
}

export async function saveAtendimentoConfig(input: {
  faixa_valor_percent?: number;
  ficha_visita_texto?: string;
}): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const existing = await getAtendimentoConfig();
  const supabase = await createClient();

  const payload: Record<string, unknown> = {};
  if (input.faixa_valor_percent !== undefined) {
    payload.faixa_valor_percent = input.faixa_valor_percent;
  }
  if (input.ficha_visita_texto !== undefined) {
    payload.ficha_visita_texto = input.ficha_visita_texto;
  }

  if (existing) {
    const { error } = await supabase
      .from("atendimento_config")
      .update(payload)
      .eq("corretor_id", corretor.id);
    if (error) return { error: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("atendimento_config").insert({
      corretor_id: corretor.id,
      ...payload,
    });
    if (error) return { error: "Não foi possível salvar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Configuração salva." };
}

async function seedMotivosDescarte(corretorId: string) {
  const supabase = await createClient();
  const rows = DEFAULT_MOTIVOS_DESCARTE.map((nome, ordem) => ({
    corretor_id: corretorId,
    nome,
    ordem,
    ativo: true,
  }));
  await supabase.from("motivos_descarte").insert(rows);
}

export async function getMotivosDescarte(): Promise<MotivoDescarte[]> {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("motivos_descarte")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("ordem");

  if (!data?.length) {
    await seedMotivosDescarte(corretor.id);
    const { data: seeded } = await supabase
      .from("motivos_descarte")
      .select("*")
      .eq("corretor_id", corretor.id)
      .order("ordem");
    return (seeded ?? []) as MotivoDescarte[];
  }

  return data as MotivoDescarte[];
}

export async function saveMotivoDescarte(input: {
  id?: string;
  nome: string;
  ativo?: boolean;
  ordem?: number;
}): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome." };

  const supabase = await createClient();

  if (input.id) {
    const { error } = await supabase
      .from("motivos_descarte")
      .update({
        nome,
        ativo: input.ativo ?? true,
        ordem: input.ordem ?? 0,
      })
      .eq("id", input.id)
      .eq("corretor_id", corretor.id);
    if (error) return { error: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("motivos_descarte").insert({
      corretor_id: corretor.id,
      nome,
      ativo: input.ativo ?? true,
      ordem: input.ordem ?? 99,
    });
    if (error) return { error: "Não foi possível criar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Motivo salvo." };
}

export async function deleteMotivoDescarte(id: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("motivos_descarte")
    .delete()
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível excluir." };
  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Motivo excluído." };
}

export async function podeTransferirAtendimento(): Promise<boolean> {
  const perfil = await getPerfilForUser();
  return perfil?.papel === "admin" || perfil?.papel === "gerente";
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

  await avancarEtapaLead(leadId, "visita_agendada", supabase, corretor.id, false);
  await registrarInteracao(leadId, "visita", "Visita agendada.");
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

  if (error) return { error: "Não foi possível atualizar a visita." };

  const leadId = visita.lead_id as string;

  if (input.status === "realizada") {
    await avancarEtapaLead(leadId, "visita_agendada", supabase, corretor.id, false);
    await registrarInteracao(leadId, "visita", "Visita realizada.");
    await registrarAuditoria(leadId, "visita_realizada", { visita_id: visitaId });
  } else if (input.status === "cancelada") {
    await registrarInteracao(leadId, "visita", "Visita cancelada.");
    await registrarAuditoria(leadId, "visita_cancelada", { visita_id: visitaId });
  } else {
    await registrarAuditoria(leadId, "visita_atualizada", { visita_id: visitaId, ...payload });
  }

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Visita atualizada." };
}

export async function editarVisita(
  visitaId: string,
  data: string,
  hora: string,
): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  if (!data.trim() || !hora.trim()) {
    return { error: "Informe data e hora." };
  }

  const dataVisita = new Date(`${data}T${hora}`);
  if (Number.isNaN(dataVisita.getTime())) {
    return { error: "Data ou hora inválida." };
  }

  const supabase = await createClient();
  const { data: visita, error: buscaError } = await supabase
    .from("visitas")
    .select("id, lead_id, imovel:imoveis(codigo)")
    .eq("id", visitaId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (buscaError || !visita) return { error: "Visita não encontrada." };

  const novaData = dataVisita.toISOString();
  const leadId = visita.lead_id as string;
  const imovelCodigo =
    (visita.imovel as { codigo?: string | null } | null)?.codigo ?? "????";

  const { error } = await supabase
    .from("visitas")
    .update({ data_visita: novaData })
    .eq("id", visitaId);

  if (error) return { error: "Não foi possível reagendar a visita." };

  await supabase
    .from("agenda")
    .update({ data_atividade: novaData })
    .eq("visita_id", visitaId)
    .eq("corretor_id", corretor.id);

  const dataFmt = dataVisita.toLocaleDateString("pt-BR");
  const horaFmt = dataVisita.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaExibicao = horaFmt.replace(":", "h");

  await registrarInteracao(
    leadId,
    "visita",
    `Visita no imóvel #${imovelCodigo} reagendada para ${dataFmt} às ${horaExibicao}`,
  );
  await registrarAuditoria(leadId, "visita_reagendada", {
    visita_id: visitaId,
    data_visita: novaData,
  });

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Visita reagendada." };
}

export async function deleteVisita(visitaId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: visita } = await supabase
    .from("visitas")
    .select("lead_id")
    .eq("id", visitaId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!visita) return { error: "Visita não encontrada." };

  const { error } = await supabase.from("visitas").delete().eq("id", visitaId);
  if (error) return { error: "Não foi possível excluir." };

  await registrarInteracao(visita.lead_id as string, "visita", "Visita excluída.");
  revalidateAtendimentoPaths(visita.lead_id as string);
  return { success: true, message: "Visita excluída." };
}

export async function gerarFichaVisitaHtml(
  leadId: string,
  visitaIds: string[],
): Promise<AtendimentoActionResult & { html?: string }> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };
  if (!visitaIds.length) return { error: "Selecione ao menos uma visita." };

  const supabase = await createClient();
  const perfil = await getPerfilForUser();

  const [leadRes, visitasRes, config] = await Promise.all([
    supabase
      .from("leads")
      .select("nome, telefone, email, codigo_atendimento")
      .eq("id", leadId)
      .eq("corretor_id", corretor.id)
      .maybeSingle(),
    supabase
      .from("visitas")
      .select(
        "*, imovel:imoveis(titulo, codigo, bairro, cidade, logradouro, numero, complemento, estado, cep, finalidade, valor_venda, valor_locacao)",
      )
      .in("id", visitaIds)
      .eq("corretor_id", corretor.id)
      .order("data_visita", { ascending: true }),
    getAtendimentoConfig(),
  ]);

  const lead = leadRes.data;
  const visitas = visitasRes.data ?? [];
  if (!lead || !visitas.length) return { error: "Dados não encontrados." };

  type ImovelFicha = {
    titulo?: string | null;
    codigo?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    estado?: string | null;
    cep?: string | null;
    finalidade?: string | null;
    valor_venda?: number | null;
    valor_locacao?: number | null;
  };

  function formatEnderecoCompleto(imovel: ImovelFicha): string {
    const logradouro = [imovel.logradouro, imovel.numero].filter(Boolean).join(", ");
    const partes = [
      logradouro || null,
      imovel.complemento,
      imovel.bairro,
      [imovel.cidade, imovel.estado].filter(Boolean).join(" - ") || null,
      imovel.cep ? `CEP ${imovel.cep}` : null,
    ].filter(Boolean);
    return partes.join(" · ");
  }

  function getValorImovel(imovel: ImovelFicha): string {
    const valor =
      imovel.finalidade === "venda" ? imovel.valor_venda : imovel.valor_locacao;
    if (valor == null) return "—";
    if (imovel.finalidade === "locacao") {
      return `${formatCurrency(valor)}/mês`;
    }
    return formatCurrency(valor);
  }

  const primeiraVisita = visitas[0];
  const dataRef = new Date(primeiraVisita.data_visita as string);
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const cidadeImovel =
    (primeiraVisita.imovel as ImovelFicha | null)?.cidade ??
    (primeiraVisita.imovel as ImovelFicha | null)?.bairro ??
    "";

  const corretorNome = perfil?.nome ?? corretor.nome;
  const corretorTelefone =
    perfil?.telefone ?? corretor.contato_telefone ?? corretor.telefone ?? "—";

  const visitasHtml = visitas
    .map((v) => {
      const im = v.imovel as ImovelFicha | null;
      const codigo = im?.codigo ?? "—";
      const endereco = im ? formatEnderecoCompleto(im) : "—";
      const valor = im ? getValorImovel(im) : "—";
      const dataVisita = new Date(v.data_visita as string).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `<div class="visita-item">
        <h3>Imóvel #${escapeHtml(codigo)}</h3>
        <p><strong>Endereço:</strong> ${escapeHtml(endereco)}</p>
        <p><strong>Valor:</strong> ${escapeHtml(valor)}</p>
        <p><strong>Visita:</strong> ${escapeHtml(dataVisita)}</p>
      </div>`;
    })
    .join("");

  const imoveisLista = visitas
    .map((v) => {
      const im = v.imovel as ImovelFicha | null;
      return `- ${im?.titulo ?? im?.codigo ?? "Imóvel"} (${im?.bairro ?? ""})`;
    })
    .join("\n");

  const template = config?.ficha_visita_texto ?? DEFAULT_FICHA_VISITA_TEXTO;
  const textoPersonalizado = template
    .replace(/\[Nome do corretor\]/g, corretorNome)
    .replace(/\[Nome do lead\]/g, lead.nome ?? "")
    .replace(/\[Cidade do imóvel\]/g, cidadeImovel)
    .replace(/\[Dia\]/g, String(dataRef.getDate()))
    .replace(/\[Mês\]/g, meses[dataRef.getMonth()] ?? "")
    .replace(/\[Ano\]/g, String(dataRef.getFullYear()))
    .replace(/\{\{cliente_nome\}\}/g, lead.nome ?? "")
    .replace(/\{\{cliente_telefone\}\}/g, lead.telefone ?? "")
    .replace(/\{\{data_visita\}\}/g, dataRef.toLocaleDateString("pt-BR"))
    .replace(/\{\{imoveis_lista\}\}/g, imoveisLista)
    .replace(/\{\{observacoes\}\}/g, "")
    .replace(/\{\{corretor_nome\}\}/g, corretorNome);

  const imobiliariaNome = corretor.nome;
  const imobiliariaEndereco = corretor.contato_endereco ?? "";
  const imobiliariaTelefone =
    corretor.contato_telefone ?? corretor.telefone ?? corretor.whatsapp ?? "";

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Ficha de visita — ${escapeHtml(lead.codigo_atendimento ?? lead.nome ?? "Atendimento")}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #1a1a2e;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px;
      font-size: 14px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 { margin: 0; font-size: 20px; }
    .header .meta { text-align: right; font-size: 12px; color: #555; }
    .block {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .block h2 {
      margin: 0 0 12px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #555;
    }
    .block dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 4px 12px; }
    .block dt { color: #666; }
    .block dd { margin: 0; font-weight: 500; }
    .visita-item {
      border-top: 1px solid #eee;
      padding-top: 12px;
      margin-top: 12px;
    }
    .visita-item:first-child { border-top: none; padding-top: 0; margin-top: 0; }
    .visita-item h3 { margin: 0 0 6px; font-size: 15px; }
    .visita-item p { margin: 2px 0; }
    .texto-personalizado {
      white-space: pre-wrap;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
    }
    @media print {
      body { padding: 16px; }
      .block { break-inside: avoid; }
      .visita-item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <h1>${escapeHtml(imobiliariaNome)}</h1>
      ${imobiliariaEndereco ? `<p style="margin:4px 0 0;font-size:12px;color:#555">${escapeHtml(imobiliariaEndereco)}</p>` : ""}
    </div>
    <div class="meta">
      ${imobiliariaTelefone ? `<p>Tel: ${escapeHtml(imobiliariaTelefone)}</p>` : ""}
      <p>Ficha de visita</p>
      <p>${escapeHtml(new Date().toLocaleDateString("pt-BR"))}</p>
    </div>
  </header>

  <section class="block">
    <h2>Lead</h2>
    <dl>
      <dt>Código ATD</dt><dd>${escapeHtml(lead.codigo_atendimento ?? "—")}</dd>
      <dt>Nome</dt><dd>${escapeHtml(lead.nome ?? "—")}</dd>
      <dt>Telefone</dt><dd>${escapeHtml(lead.telefone ?? "—")}</dd>
      <dt>E-mail</dt><dd>${escapeHtml(lead.email ?? "—")}</dd>
    </dl>
  </section>

  <section class="block">
    <h2>Corretor responsável</h2>
    <dl>
      <dt>Nome</dt><dd>${escapeHtml(corretorNome)}</dd>
      <dt>Telefone</dt><dd>${escapeHtml(corretorTelefone)}</dd>
    </dl>
  </section>

  <section class="block">
    <h2>Imóveis visitados</h2>
    ${visitasHtml}
  </section>

  <section class="texto-personalizado">${escapeHtml(textoPersonalizado)}</section>
</body>
</html>`;

  return { success: true, html: fullHtml };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    await avancarEtapaLead(leadId, "proposta", supabase, corretor.id, false);
  }
  if (status === "recusada") {
    await avancarEtapaLead(leadId, "perdido", supabase, corretor.id, false);
  }

  await registrarInteracao(
    leadId,
    "proposta",
    `Proposta registrada: R$ ${input.valor_proposto.toLocaleString("pt-BR")}.`,
  );
  await registrarAuditoria(leadId, "proposta_registrada", {
    proposta_id: data.id,
    status,
    valor: input.valor_proposto,
  });

  if (input.imovel_id && status !== "cancelada" && status !== "recusada") {
    await atualizarStatusImovelAutomatico(
      input.imovel_id,
      "Reservado",
      "Proposta registrada no atendimento",
      { proposta_id: data.id, lead_id: leadId },
    );
  }

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

  const { error } = await supabase.from("propostas").update({ status }).eq("id", propostaId);

  if (error) return { error: "Não foi possível atualizar a proposta." };

  const leadId = proposta.lead_id as string;

  if (status === "recusada") {
    await avancarEtapaLead(leadId, "perdido", supabase, corretor.id, false);
  } else if (status !== "cancelada") {
    await avancarEtapaLead(leadId, "proposta", supabase, corretor.id, false);
  }

  await registrarInteracao(leadId, "proposta", `Status da proposta: ${status}.`);
  await registrarAuditoria(
    leadId,
    status === "cancelada" ? "proposta_cancelada" : "proposta_status_alterado",
    { proposta_id: propostaId, status },
  );

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Status da proposta atualizado." };
}

export async function deleteProposta(propostaId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: proposta } = await supabase
    .from("propostas")
    .select("lead_id, status")
    .eq("id", propostaId)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!proposta) return { error: "Proposta não encontrada." };

  if (proposta.status !== "cancelada") {
    const { error } = await supabase
      .from("propostas")
      .update({ status: "cancelada" })
      .eq("id", propostaId);

    if (error) return { error: "Não foi possível cancelar a proposta." };

    await registrarInteracao(proposta.lead_id as string, "proposta", "Proposta cancelada.");
    await registrarAuditoria(proposta.lead_id as string, "proposta_cancelada", {
      proposta_id: propostaId,
    });
    revalidateAtendimentoPaths(proposta.lead_id as string);
    return { success: true, message: "Proposta cancelada." };
  }

  const { error } = await supabase.from("propostas").delete().eq("id", propostaId);
  if (error) return { error: "Não foi possível excluir." };

  await registrarInteracao(proposta.lead_id as string, "proposta", "Proposta excluída.");
  revalidateAtendimentoPaths(proposta.lead_id as string);
  return { success: true, message: "Proposta excluída." };
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

  await supabase
    .from("leads")
    .update({
      etapa: "fechado",
      situacao: "negocio_fechado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", leadId);

  await registrarInteracao(leadId, "anotacao", "Negócio fechado.");
  await registrarAuditoria(leadId, "negocio_fechado", {
    negocio_id: data.id,
    valor: input.valor_fechamento,
  });

  if (input.imovel_id) {
    const { data: imovel } = await supabase
      .from("imoveis")
      .select("finalidade")
      .eq("id", input.imovel_id)
      .maybeSingle();

    const statusNome = imovel?.finalidade === "locacao" ? "Locado" : "Vendido";
    await atualizarStatusImovelAutomatico(
      input.imovel_id,
      statusNome,
      "Negócio fechado no atendimento",
      { negocio_id: data.id, lead_id: leadId },
    );
  }

  revalidateAtendimentoPaths(leadId);
  return { success: true, id: data.id, message: "Negócio fechado registrado." };
}

export async function marcarNegocioPerdido(leadId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();

  const { data: propostasAtivas } = await supabase
    .from("propostas")
    .select("imovel_id")
    .eq("lead_id", leadId)
    .eq("corretor_id", corretor.id)
    .not("status", "in", '("cancelada","recusada")');

  await supabase
    .from("leads")
    .update({ etapa: "perdido", atualizado_em: new Date().toISOString() })
    .eq("id", leadId)
    .eq("corretor_id", corretor.id);

  const imovelIds = new Set(
    (propostasAtivas ?? []).map((p) => p.imovel_id).filter(Boolean) as string[],
  );

  for (const imovelId of imovelIds) {
    await atualizarStatusImovelAutomatico(
      imovelId,
      "Disponível",
      "Negócio perdido no atendimento",
      { lead_id: leadId },
    );
  }

  await registrarInteracao(leadId, "anotacao", "Negócio perdido.");
  await registrarAuditoria(leadId, "negocio_perdido", {});
  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Marcado como negócio perdido." };
}

export async function selecionarImovel(
  leadId: string,
  imovelId: string,
  etiqueta?: string,
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

  await avancarEtapaLead(leadId, "qualificado", supabase, corretor.id, false);
  await registrarInteracao(
    leadId,
    "anotacao",
    etiqueta ? `Imóvel selecionado (${etiqueta}).` : "Imóvel selecionado no radar.",
  );
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

  await registrarInteracao(leadId, "anotacao", "Imóvel removido da seleção.");
  await registrarAuditoria(leadId, "imovel_removido_selecao", { imovel_id: imovelId });
  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Imóvel removido da seleção." };
}

export async function qualificarLead(leadId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  await avancarEtapaLead(leadId, "qualificado", supabase, corretor.id, false);
  await registrarInteracao(leadId, "anotacao", "Lead qualificado.");
  await registrarAuditoria(leadId, "lead_qualificado", {});

  revalidateAtendimentoPaths(leadId);
  return { success: true, message: "Lead qualificado." };
}

export async function marcarContatoFeito(leadId: string): Promise<AtendimentoActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  await avancarEtapaLead(leadId, "contato_feito", supabase, corretor.id, false);
  await registrarInteracao(leadId, "ligacao", "Contato realizado.");
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
    await registrarInteracao(leadId, "anotacao", "Imóvel de interesse vinculado.");
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
    tipo: input.tipo as TipoInteracao,
    descricao: input.descricao,
    data: input.data,
  });
}

export async function getLeadResponsavelNome(lead: Lead, perfis: { id: string; nome: string }[]) {
  const perfilId = await getLeadPerfilId(lead);
  return perfis.find((p) => p.id === perfilId)?.nome ?? lead.perfil?.nome ?? null;
}
