const ZAPI_BASE_URL = "https://api.z-api.io";

export class ZApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ZApiError";
  }
}

export async function enviarMensagemZAPI(
  instanceId: string,
  token: string,
  telefone: string,
  mensagem: string,
): Promise<void> {
  if (!instanceId || !token) {
    throw new ZApiError("Instância Z-API não configurada para este corretor.", 400);
  }

  const url = `${ZAPI_BASE_URL}/instances/${encodeURIComponent(instanceId)}/token/${encodeURIComponent(token)}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: telefone,
      message: mensagem,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Falha ao enviar mensagem Z-API (${response.status})`;

    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      errorMessage = payload.error ?? payload.message ?? errorMessage;
    } catch {
      // Resposta não-JSON — mantém mensagem padrão
    }

    throw new ZApiError(errorMessage, response.status);
  }
}
