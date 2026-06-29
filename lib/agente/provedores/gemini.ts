import type { AgenteConfig, LeadInteracao, RespostaAgente } from "@/types";

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
}

export async function processarGemini(
  systemPrompt: string,
  mensagemLead: string,
  historico: LeadInteracao[],
  config: AgenteConfig,
): Promise<RespostaAgente> {
  if (!config.api_key) {
    throw new Error("Chave de API Google Gemini não configurada.");
  }

  const contents: GeminiContent[] = historico.slice(-20).map((item) => ({
    role: item.de === "lead" ? "user" : "model",
    parts: [{ text: item.conteudo }],
  }));

  contents.push({ role: "user", parts: [{ text: mensagemLead }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.modelo)}:generateContent?key=${encodeURIComponent(config.api_key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }),
  });

  const data = (await response.json()) as GeminiGenerateResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Erro na API Google Gemini.");
  }

  const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!texto) {
    throw new Error("Resposta vazia da API Google Gemini.");
  }

  return {
    texto,
    tokens_usados: data.usageMetadata?.totalTokenCount ?? 0,
    provedor: "gemini",
    modelo: config.modelo,
  };
}
