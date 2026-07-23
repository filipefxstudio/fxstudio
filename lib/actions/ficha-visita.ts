"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_FICHA_VISITA_CLAUSULA,
  DEFAULT_PERCENTUAL_COMISSAO,
} from "@/lib/ficha-visita/constants";
import { renderFichaVisitaHtml } from "@/lib/ficha-visita/render-html";
import {
  resolvePercentualComissao,
  type ImovelFichaRow,
} from "@/lib/ficha-visita/utils";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { ConfigFichaVisita } from "@/types";

export type FichaVisitaActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  html?: string;
};

async function ensureConfigFichaVisita(corretorId: string): Promise<ConfigFichaVisita | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config_ficha_visita")
    .select("*")
    .eq("corretor_id", corretorId)
    .maybeSingle();

  if (data) return data as ConfigFichaVisita;

  const { data: created, error } = await supabase
    .from("config_ficha_visita")
    .insert({
      corretor_id: corretorId,
      usa_texto_padrao: true,
      percentual_comissao: DEFAULT_PERCENTUAL_COMISSAO,
    })
    .select("*")
    .single();

  if (error) return null;
  return (created as ConfigFichaVisita) ?? null;
}

export async function getConfigFichaVisita(): Promise<ConfigFichaVisita | null> {
  const corretor = await getCorretorForUser();
  if (!corretor) return null;
  return ensureConfigFichaVisita(corretor.id);
}

export async function saveConfigFichaVisita(input: {
  texto_clausula: string;
  percentual_comissao: number;
}): Promise<FichaVisitaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const percentual = resolvePercentualComissao(input.percentual_comissao);
  if (percentual < 0 || percentual > 100) {
    return { error: "Percentual de comissão inválido." };
  }

  const supabase = await createClient();
  const existing = await ensureConfigFichaVisita(corretor.id);

  const payload = {
    texto_clausula: input.texto_clausula.trim(),
    percentual_comissao: percentual,
    usa_texto_padrao: false,
    atualizado_em: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("config_ficha_visita")
      .update(payload)
      .eq("corretor_id", corretor.id);
    if (error) return { error: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("config_ficha_visita").insert({
      corretor_id: corretor.id,
      ...payload,
    });
    if (error) return { error: "Não foi possível salvar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Alterações salvas." };
}

export async function restoreDefaultFichaVisita(): Promise<FichaVisitaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const existing = await ensureConfigFichaVisita(corretor.id);

  const payload = {
    texto_clausula: DEFAULT_FICHA_VISITA_CLAUSULA,
    percentual_comissao: DEFAULT_PERCENTUAL_COMISSAO,
    usa_texto_padrao: true,
    atualizado_em: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("config_ficha_visita")
      .update(payload)
      .eq("corretor_id", corretor.id);
    if (error) return { error: "Não foi possível restaurar." };
  } else {
    const { error } = await supabase.from("config_ficha_visita").insert({
      corretor_id: corretor.id,
      ...payload,
    });
    if (error) return { error: "Não foi possível restaurar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Ficha padrão restaurada." };
}

export async function generateFichaVisita(
  leadId: string,
  visitaIds: string[],
): Promise<FichaVisitaActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };
  if (!visitaIds.length) return { error: "Selecione ao menos uma visita." };

  const supabase = await createClient();

  const [leadRes, visitasRes, config] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "nome, telefone, codigo_atendimento, cliente_id, cliente:clientes(nome, observacoes)",
      )
      .eq("id", leadId)
      .eq("corretor_id", corretor.id)
      .maybeSingle(),
    supabase
      .from("visitas")
      .select(
        "id, imovel:imoveis(codigo, logradouro, numero, complemento, bairro, cidade, finalidade, valor_venda, valor_locacao)",
      )
      .in("id", visitaIds)
      .eq("corretor_id", corretor.id)
      .eq("lead_id", leadId)
      .order("data_visita", { ascending: true }),
    ensureConfigFichaVisita(corretor.id),
  ]);

  const lead = leadRes.data;
  const visitas = visitasRes.data ?? [];

  if (!lead || !visitas.length) {
    return { error: "Dados não encontrados." };
  }

  type ClienteJoin = { nome?: string | null; observacoes?: string | null } | null;

  const cliente = lead.cliente as ClienteJoin;

  const clienteEndereco = cliente?.observacoes?.trim() || undefined;

  const corretorResponsavel = corretor.nome?.trim() || "—";
  const corretorTelefone = corretor.telefone?.trim() || undefined;

  const imoveis: ImovelFichaRow[] = visitas
    .map((v) => v.imovel as ImovelFichaRow | null)
    .filter((im): im is ImovelFichaRow => im != null);

  if (!imoveis.length) {
    return { error: "Nenhum imóvel encontrado nas visitas selecionadas." };
  }

  const html = renderFichaVisitaHtml({
    corretor,
    lead: {
      codigo_atendimento: lead.codigo_atendimento,
      nome: lead.nome,
      telefone: lead.telefone,
      cliente_nome: cliente?.nome ?? lead.nome,
      cliente_endereco: clienteEndereco,
    },
    corretorResponsavel,
    corretorTelefone,
    imoveis,
    clausula: {
      usaTextoPadrao: config?.usa_texto_padrao ?? true,
      textoClausula: config?.texto_clausula,
      percentualComissao: resolvePercentualComissao(config?.percentual_comissao),
    },
  });

  return { success: true, html };
}
