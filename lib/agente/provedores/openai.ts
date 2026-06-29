import type { AgenteConfig, LeadInteracao, RespostaAgente } from "@/types";

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

export async function processarOpenAI(
  systemPrompt: string,
  mensagemLead: string,
  historico: LeadInteracao[],
  config: AgenteConfig,
): Promise<RespostaAgente> {
  if (!config.api_key) {
    throw new Error("Chave de API OpenAI não configurada.");
  }

  const messages: OpenAIChatMessage[] = historico.slice(-20).map((item) => ({
    role: item.de === "lead" ? "user" : "assistant",
    content: item.conteudo,
  }));

  messages.push({ role: "user", content: mensagemLead });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      model: config.modelo,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = (await response.json()) as OpenAIChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Erro na API OpenAI.");
  }

  const texto = data.choices?.[0]?.message?.content?.trim();

  if (!texto) {
    throw new Error("Resposta vazia da API OpenAI.");
  }

  return {
    texto,
    tokens_usados: data.usage?.total_tokens ?? 0,
    provedor: "openai",
    modelo: config.modelo,
  };
}
