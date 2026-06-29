import type { AgenteConfig, LeadInteracao, RespostaAgente } from "@/types";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicMessagesResponse {
  content?: Array<{
    text?: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

export async function processarAnthropic(
  systemPrompt: string,
  mensagemLead: string,
  historico: LeadInteracao[],
  config: AgenteConfig,
): Promise<RespostaAgente> {
  if (!config.api_key) {
    throw new Error("Chave de API Anthropic não configurada.");
  }

  const messages: AnthropicMessage[] = historico.slice(-20).map((item) => ({
    role: item.de === "lead" ? "user" : "assistant",
    content: item.conteudo,
  }));

  messages.push({ role: "user", content: mensagemLead });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.api_key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.modelo,
      system: systemPrompt,
      messages,
      max_tokens: 500,
    }),
  });

  const data = (await response.json()) as AnthropicMessagesResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Erro na API Anthropic.");
  }

  const texto = data.content?.[0]?.text?.trim();

  if (!texto) {
    throw new Error("Resposta vazia da API Anthropic.");
  }

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;

  return {
    texto,
    tokens_usados: inputTokens + outputTokens,
    provedor: "anthropic",
    modelo: config.modelo,
  };
}
