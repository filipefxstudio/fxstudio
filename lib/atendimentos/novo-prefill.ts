export type NovoAtendimentoPrefill = {
  telefone?: string;
  email?: string;
  clienteId?: string;
  nome?: string;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
}

export function parseNovoAtendimentoPrefill(
  params: Record<string, string | string[] | undefined>,
): NovoAtendimentoPrefill | undefined {
  const telefone = getParam(params, "telefone");
  const email = getParam(params, "email");
  const clienteId = getParam(params, "clienteId");
  const nome = getParam(params, "nome");

  if (!telefone && !email && !clienteId && !nome) {
    return undefined;
  }

  return { telefone, email, clienteId, nome };
}

export function buildNovoAtendimentoUrl(prefill: NovoAtendimentoPrefill): string {
  const params = new URLSearchParams();

  if (prefill.telefone) {
    params.set("telefone", prefill.telefone);
  }
  if (prefill.email) {
    params.set("email", prefill.email);
  }
  if (prefill.clienteId) {
    params.set("clienteId", prefill.clienteId);
  }
  if (prefill.nome) {
    params.set("nome", prefill.nome);
  }

  const qs = params.toString();
  return `/dashboard/atendimentos/novo${qs ? `?${qs}` : ""}`;
}
