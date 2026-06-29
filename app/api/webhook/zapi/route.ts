import { processarAgenteIA } from "@/lib/agente";
import { processarChatbot } from "@/lib/agente/chatbot";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enviarMensagemZAPI } from "@/lib/zapi/client";
import type {
  AgenteConfig,
  Assinatura,
  CorretorComRelacoes,
  Lead,
  LeadInteracao,
  PlanoAssinatura,
  ZApiWebhookBody,
} from "@/types";
import { NextResponse } from "next/server";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function jsonError(status: number, message: string) {
  return NextResponse.json(
    isDev() ? { ok: false, error: message } : { ok: false },
    { status },
  );
}

function validarWebhookSecret(request: Request): boolean {
  const secret = process.env.ZAPI_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const headerSecret =
    request.headers.get("x-z-api-token") ??
    request.headers.get("client-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return headerSecret === secret;
}

function normalizarAgenteConfig(
  config: CorretorComRelacoes["agente_config"],
): AgenteConfig | null {
  if (!config) {
    return null;
  }

  if (Array.isArray(config)) {
    return config[0] ?? null;
  }

  return config;
}

function obterPlanoAtivo(assinaturas: Assinatura[] | undefined): PlanoAssinatura {
  const ativa = assinaturas?.find((item) => item.status === "ativo");
  return ativa?.plano ?? "basico";
}

function deveUsarAgenteIA(
  plano: PlanoAssinatura,
  config: AgenteConfig | null,
): boolean {
  return (
    plano === "profissional" &&
    config?.ativo === true &&
    Boolean(config.api_key)
  );
}

export async function POST(request: Request) {
  try {
    if (!validarWebhookSecret(request)) {
      console.error("[webhook/zapi] Secret inválido");
      return jsonError(401, "Não autorizado.");
    }

    const body = (await request.json()) as ZApiWebhookBody;
    const telefone = body.phone?.trim();
    const mensagem = body.text?.message?.trim() ?? "";
    const instanceId = body.instanceId?.trim();

    if (!telefone || !instanceId) {
      return jsonError(400, "Payload inválido: phone e instanceId são obrigatórios.");
    }

    if (!mensagem) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceRoleClient();

    const { data: corretorRaw, error: corretorError } = await supabase
      .from("corretores")
      .select("*, assinaturas(*), agente_config(*)")
      .eq("zapi_instance_id", instanceId)
      .maybeSingle();

    if (corretorError) {
      console.error("[webhook/zapi] Erro ao buscar corretor", {
        message: corretorError.message,
      });
      return jsonError(500, corretorError.message);
    }

    if (!corretorRaw) {
      console.error("[webhook/zapi] Corretor não encontrado", { instanceId });
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const corretor = corretorRaw as CorretorComRelacoes;
    const agenteConfig = normalizarAgenteConfig(corretor.agente_config);
    const plano = obterPlanoAtivo(corretor.assinaturas);

    let lead: Lead | null = null;

    const { data: leadExistente, error: leadBuscaError } = await supabase
      .from("leads")
      .select("*")
      .eq("corretor_id", corretor.id)
      .eq("telefone", telefone)
      .maybeSingle();

    if (leadBuscaError) {
      console.error("[webhook/zapi] Erro ao buscar lead", {
        message: leadBuscaError.message,
      });
      return jsonError(500, leadBuscaError.message);
    }

    if (leadExistente) {
      lead = leadExistente as Lead;
    } else {
      const { data: novoLead, error: leadInsertError } = await supabase
        .from("leads")
        .insert({
          corretor_id: corretor.id,
          telefone,
          origem: "whatsapp",
          etapa: "novo",
          temperatura: "frio",
          etapa_chatbot: "inicio",
          atendido_por: "chatbot",
          conversa_ativa: false,
        })
        .select("*")
        .single();

      if (leadInsertError || !novoLead) {
        console.error("[webhook/zapi] Erro ao criar lead", {
          message: leadInsertError?.message,
        });
        return jsonError(500, leadInsertError?.message ?? "Erro ao criar lead.");
      }

      lead = novoLead as Lead;
    }

    const { error: interacaoLeadError } = await supabase
      .from("lead_interacoes")
      .insert({
        lead_id: lead.id,
        corretor_id: corretor.id,
        tipo: "mensagem_whatsapp",
        conteudo: mensagem,
        de: "lead",
      });

    if (interacaoLeadError) {
      console.error("[webhook/zapi] Erro ao salvar mensagem do lead", {
        message: interacaoLeadError.message,
      });
      return jsonError(500, interacaoLeadError.message);
    }

    const { data: historicoRaw, error: historicoError } = await supabase
      .from("lead_interacoes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("criado_em", { ascending: true });

    if (historicoError) {
      console.error("[webhook/zapi] Erro ao buscar histórico", {
        message: historicoError.message,
      });
      return jsonError(500, historicoError.message);
    }

    const historico = (historicoRaw ?? []) as LeadInteracao[];

    let resposta = "";
    let tokensUsados = 0;
    let atendidoPor: "chatbot" | "agente_ia" = "chatbot";

    if (deveUsarAgenteIA(plano, agenteConfig) && agenteConfig) {
      const { data: imoveisRaw, error: imoveisError } = await supabase
        .from("imoveis")
        .select("*, fotos:imovel_fotos(*)")
        .eq("corretor_id", corretor.id)
        .eq("status", "disponivel");

      if (imoveisError) {
        console.error("[webhook/zapi] Erro ao buscar imóveis", {
          message: imoveisError.message,
        });
        return jsonError(500, imoveisError.message);
      }

      try {
        const resultado = await processarAgenteIA(
          mensagem,
          lead,
          corretor,
          agenteConfig,
          imoveisRaw ?? [],
          historico,
        );

        resposta = resultado.texto;
        tokensUsados = resultado.tokens_usados;
        atendidoPor = "agente_ia";
      } catch (agenteError) {
        console.error("[webhook/zapi] Erro no agente IA, fallback chatbot", {
          message:
            agenteError instanceof Error
              ? agenteError.message
              : "Erro desconhecido",
        });
        resposta = await processarChatbot(lead, mensagem, corretor);
        atendidoPor = "chatbot";
      }
    } else {
      if (plano === "profissional" && agenteConfig?.ativo && !agenteConfig.api_key) {
        console.error(
          "[webhook/zapi] Agente ativo sem api_key, usando chatbot",
          { corretorId: corretor.id },
        );
      }

      resposta = await processarChatbot(lead, mensagem, corretor);
      atendidoPor = "chatbot";
    }

    if (!resposta.trim()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { error: interacaoBotError } = await supabase
      .from("lead_interacoes")
      .insert({
        lead_id: lead.id,
        corretor_id: corretor.id,
        tipo: "mensagem_whatsapp",
        conteudo: resposta,
        de: atendidoPor === "agente_ia" ? "agente_ia" : "bot",
        tokens_usados: tokensUsados > 0 ? tokensUsados : null,
      });

    if (interacaoBotError) {
      console.error("[webhook/zapi] Erro ao salvar resposta", {
        message: interacaoBotError.message,
      });
      return jsonError(500, interacaoBotError.message);
    }

    const leadUpdate: Record<string, string | boolean> = {
      ultima_mensagem_em: new Date().toISOString(),
      conversa_ativa: true,
      atendido_por: atendidoPor,
    };

    if (atendidoPor === "chatbot") {
      const { data: leadAtualizado } = await supabase
        .from("leads")
        .select("etapa_chatbot")
        .eq("id", lead.id)
        .single();

      if (leadAtualizado?.etapa_chatbot) {
        leadUpdate.etapa_chatbot = leadAtualizado.etapa_chatbot;
      }
    }

    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update(leadUpdate)
      .eq("id", lead.id);

    if (leadUpdateError) {
      console.error("[webhook/zapi] Erro ao atualizar lead", {
        message: leadUpdateError.message,
      });
      return jsonError(500, leadUpdateError.message);
    }

    if (!corretor.zapi_instance_id || !corretor.zapi_token) {
      console.error("[webhook/zapi] Z-API não configurada", {
        corretorId: corretor.id,
      });
      return jsonError(500, "Z-API não configurada para o corretor.");
    }

    await enviarMensagemZAPI(
      corretor.zapi_instance_id,
      corretor.zapi_token,
      telefone,
      resposta,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno no webhook Z-API.";

    console.error("[webhook/zapi] Erro não tratado", { message });
    return jsonError(500, message);
  }
}
