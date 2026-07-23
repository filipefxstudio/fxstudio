import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const UUID_VAZIO = "00000000-0000-0000-0000-000000000000";

export function sanitizeTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

/** Remove código do país (55) quando presente. */
export function normalizePhoneDigits(phone: string): string {
  const digits = sanitizeTelefone(phone);
  if (digits.length >= 12 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function telefonesEquivalentes(a: string, b: string): boolean {
  const digitsA = normalizePhoneDigits(a);
  const digitsB = normalizePhoneDigits(b);

  if (!digitsA || !digitsB) {
    return false;
  }

  if (digitsA === digitsB) {
    return true;
  }

  if (digitsA.length >= 8 && digitsB.length >= 8 && digitsA.slice(-8) === digitsB.slice(-8)) {
    return true;
  }

  if (digitsA.length >= 9 && digitsB.length >= 9 && digitsA.slice(-9) === digitsB.slice(-9)) {
    return true;
  }

  return digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailValidoParaBusca(email: string): boolean {
  return email.includes("@") && email.trim().length >= 3;
}

export function contatoInalterado(
  telefone: string,
  email: string | undefined | null,
  originalTelefone: string | undefined | null,
  originalEmail: string | undefined | null,
): boolean {
  const telIgual = telefonesEquivalentes(telefone, originalTelefone ?? "");
  const emailNorm = normalizeEmail(email ?? "");
  const origEmailNorm = normalizeEmail(originalEmail ?? "");
  return telIgual && emailNorm === origEmailNorm;
}

/** Mínimo de dígitos para busca parcial no autocomplete. */
export const MIN_TELEFONE_BUSCA_AUTOCOMPLETE = 4;

function clienteMatchesTelefoneBusca(cliente: ClienteRow, telefoneLimpo: string): boolean {
  const digits = normalizePhoneDigits(cliente.telefone ?? "");

  if (!digits || telefoneLimpo.length < MIN_TELEFONE_BUSCA_AUTOCOMPLETE) {
    return false;
  }

  return (
    digits.includes(telefoneLimpo) ||
    telefoneLimpo.includes(digits) ||
    telefonesEquivalentes(cliente.telefone ?? "", telefoneLimpo)
  );
}

function clienteMatchesEmailBusca(cliente: ClienteRow, emailNorm: string): boolean {
  if (!cliente.email || !emailValidoParaBusca(emailNorm)) {
    return false;
  }

  return normalizeEmail(cliente.email).includes(emailNorm);
}

type ClienteRow = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  eh_construtor_investidor?: boolean;
  corretor_id?: string;
};

type LeadRow = {
  id: string;
  nome: string | null;
  telefone: string | null;
  email?: string | null;
  cliente_id?: string | null;
};

function leadMatchesTelefoneBusca(lead: LeadRow, telefoneLimpo: string): boolean {
  return clienteMatchesTelefoneBusca(
    { id: lead.id, nome: lead.nome ?? "", telefone: lead.telefone ?? "" },
    telefoneLimpo,
  );
}

function leadMatchesEmailBusca(lead: LeadRow, emailNorm: string): boolean {
  return clienteMatchesEmailBusca(
    { id: lead.id, nome: lead.nome ?? "", telefone: lead.telefone ?? "", email: lead.email },
    emailNorm,
  );
}

function dedupeKeyTelefone(telefone: string): string {
  return normalizePhoneDigits(telefone);
}

function dedupeKeyEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) {
    return null;
  }
  return normalizeEmail(email);
}

function clienteMatchesTelefone(cliente: ClienteRow, telefoneLimpo: string): boolean {
  return telefonesEquivalentes(cliente.telefone ?? "", telefoneLimpo);
}

function clienteMatchesEmail(cliente: ClienteRow, emailNorm: string): boolean {
  return Boolean(cliente.email && normalizeEmail(cliente.email) === emailNorm);
}

export async function findClientePorTelefoneOuEmail(
  supabase: SupabaseClient,
  corretorId: string,
  input: { telefone?: string; email?: string },
  clienteIdIgnorar?: string,
  leadIdIgnorar?: string,
): Promise<{ cliente: ClienteRow; motivo: "telefone" | "email"; leadId?: string } | null> {
  const telefoneLimpo = input.telefone ? normalizePhoneDigits(input.telefone) : "";
  const emailNorm = input.email ? normalizeEmail(input.email) : "";

  const { data: clientes, error: clientesError } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email, eh_construtor_investidor, corretor_id")
    .eq("corretor_id", corretorId);

  if (clientesError) {
    console.error("[findClientePorTelefoneOuEmail] clientes failed", clientesError);
  }

  for (const cliente of clientes ?? []) {
    if (clienteIdIgnorar && cliente.id === clienteIdIgnorar) {
      continue;
    }

    if (telefoneLimpo.length >= 10 && clienteMatchesTelefone(cliente, telefoneLimpo)) {
      return { cliente, motivo: "telefone" };
    }

    if (emailValidoParaBusca(emailNorm) && clienteMatchesEmail(cliente, emailNorm)) {
      return { cliente, motivo: "email" };
    }
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, nome, telefone, email, cliente_id")
    .eq("corretor_id", corretorId);

  if (leadsError) {
    console.error("[findClientePorTelefoneOuEmail] leads failed", leadsError);
  }

  for (const lead of leads ?? []) {
    if (leadIdIgnorar && lead.id === leadIdIgnorar) {
      continue;
    }

    const telefoneLead = lead.telefone?.trim() ?? "";
    if (!telefoneLead) {
      continue;
    }

    if (lead.cliente_id && lead.cliente_id === clienteIdIgnorar) {
      continue;
    }

    const matchTelefone =
      telefoneLimpo.length >= 10 && telefonesEquivalentes(telefoneLead, telefoneLimpo);
    const matchEmail =
      emailValidoParaBusca(emailNorm) &&
      lead.email &&
      normalizeEmail(lead.email) === emailNorm;

    if (!matchTelefone && !matchEmail) {
      continue;
    }

    if (lead.cliente_id) {
      const clienteRelacionado = (clientes ?? []).find((item) => item.id === lead.cliente_id);
      if (clienteRelacionado && (!clienteIdIgnorar || clienteRelacionado.id !== clienteIdIgnorar)) {
        return {
          cliente: clienteRelacionado,
          motivo: matchTelefone ? "telefone" : "email",
          leadId: lead.id,
        };
      }
    }

    return {
      cliente: {
        id: lead.cliente_id ?? "",
        nome: lead.nome?.trim() || "Sem nome",
        telefone: telefoneLead,
        email: lead.email,
        eh_construtor_investidor: false,
        corretor_id: corretorId,
      },
      motivo: matchTelefone ? "telefone" : "email",
      leadId: lead.id,
    };
  }

  return null;
}

export async function findClientesAutocomplete(
  supabase: SupabaseClient,
  corretorId: string,
  input: { telefone?: string; email?: string },
  limit = 10,
): Promise<
  Array<
    ClienteRow & {
      leadId?: string;
      origem: "cliente" | "lead";
    }
  >
> {
  const telefoneLimpo = input.telefone ? normalizePhoneDigits(input.telefone) : "";
  const emailNorm = input.email ? normalizeEmail(input.email) : "";

  if (
    telefoneLimpo.length < MIN_TELEFONE_BUSCA_AUTOCOMPLETE &&
    !emailValidoParaBusca(emailNorm)
  ) {
    return [];
  }

  const buscaPorTelefone = telefoneLimpo.length >= MIN_TELEFONE_BUSCA_AUTOCOMPLETE;
  const buscaPorEmail = emailValidoParaBusca(emailNorm);

  if (!buscaPorTelefone && !buscaPorEmail) {
    return [];
  }

  let leadsQuery = supabase
    .from("leads")
    .select("id, nome, telefone, email, cliente_id")
    .eq("corretor_id", corretorId);

  if (buscaPorEmail && !buscaPorTelefone) {
    leadsQuery = leadsQuery.ilike("email", `%${emailNorm}%`);
  }

  const [clientesRes, leadsRes] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome, telefone, email, eh_construtor_investidor, corretor_id")
      .eq("corretor_id", corretorId),
    leadsQuery,
  ]);

  if (clientesRes.error) {
    console.error("[findClientesAutocomplete] clientes failed", clientesRes.error);
  }

  if (leadsRes.error) {
    console.error("[findClientesAutocomplete] leads failed", leadsRes.error);
  }

  const clientesFiltrados = (clientesRes.data ?? []).filter((cliente) => {
    if (clienteMatchesTelefoneBusca(cliente, telefoneLimpo)) {
      return true;
    }
    return clienteMatchesEmailBusca(cliente, emailNorm);
  });

  const leadsFiltrados = (leadsRes.data ?? []).filter((lead) => {
    if (leadMatchesTelefoneBusca(lead, telefoneLimpo)) {
      return true;
    }
    return leadMatchesEmailBusca(lead, emailNorm);
  });

  const clienteIdsFromLeads = new Set(
    leadsFiltrados
      .map((lead) => lead.cliente_id)
      .filter((id): id is string => Boolean(id)),
  );

  const resultados: Array<
    ClienteRow & {
      leadId?: string;
      origem: "cliente" | "lead";
    }
  > = [];
  const chavesVistas = new Set<string>();

  for (const cliente of clientesFiltrados) {
    const chaveTel = dedupeKeyTelefone(cliente.telefone);
    const chaveEmail = dedupeKeyEmail(cliente.email);
    chavesVistas.add(chaveTel);
    if (chaveEmail) {
      chavesVistas.add(`email:${chaveEmail}`);
    }

    resultados.push({
      ...cliente,
      origem: "cliente",
    });
  }

  for (const lead of leadsFiltrados) {
    if (lead.cliente_id && clienteIdsFromLeads.has(lead.cliente_id)) {
      const jaIncluido = resultados.some((item) => item.id === lead.cliente_id);
      if (jaIncluido) {
        continue;
      }
    }

    const telefoneLead = lead.telefone?.trim() ?? "";
    if (!telefoneLead) {
      continue;
    }

    const chaveTel = dedupeKeyTelefone(telefoneLead);
    const chaveEmail = dedupeKeyEmail(lead.email);

    if (chavesVistas.has(chaveTel) || (chaveEmail && chavesVistas.has(`email:${chaveEmail}`))) {
      continue;
    }

    if (lead.cliente_id) {
      const clienteRelacionado = clientesFiltrados.find((item) => item.id === lead.cliente_id);
      if (clienteRelacionado) {
        continue;
      }
    }

    chavesVistas.add(chaveTel);
    if (chaveEmail) {
      chavesVistas.add(`email:${chaveEmail}`);
    }

    resultados.push({
      id: lead.cliente_id ?? "",
      nome: lead.nome?.trim() || "Sem nome",
      telefone: telefoneLead,
      email: lead.email,
      eh_construtor_investidor: false,
      corretor_id: corretorId,
      leadId: lead.id,
      origem: "lead",
    });
  }

  return resultados.slice(0, limit);
}

/** @deprecated Use verificarPessoaExistente em lib/actions/clientes.ts */
export async function findPessoaDuplicada(
  supabase: SupabaseClient,
  corretorId: string,
  input: { telefone: string; email?: string | null },
): Promise<{ nome: string } | null> {
  const match = await findClientePorTelefoneOuEmail(supabase, corretorId, {
    telefone: input.telefone,
    email: input.email ?? undefined,
  });

  if (!match) {
    return null;
  }

  return { nome: match.cliente.nome ?? "Pessoa cadastrada" };
}

export { UUID_VAZIO };
