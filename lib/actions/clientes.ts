"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import {
  clienteFormSchema,
  type ClienteFormValues,
} from "@/lib/validations/cliente";
import type { Cliente, Imovel, Lead, TipoCliente } from "@/types";

export type ClienteActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  clienteId?: string;
};

export type ClienteSearchResult = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  tipo: TipoCliente;
  eh_construtor_investidor: boolean;
  corretor_id: string;
  pode_vincular: boolean;
  aviso?: string;
};

function sanitizeTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

function buildClienteInsert(corretorId: string, data: ClienteFormValues) {
  return {
    corretor_id: corretorId,
    perfil_id: data.perfil_id ?? null,
    nome: data.nome.trim(),
    telefone: data.telefone.trim(),
    email: data.email?.trim() || null,
    cpf: data.cpf?.trim() || null,
    data_nascimento: data.data_nascimento?.trim() || null,
    profissao: data.profissao?.trim() || null,
    estado_civil: data.estado_civil?.trim() || null,
    observacoes: data.observacoes?.trim() || null,
    tipo: data.tipo,
    eh_construtor_investidor: data.eh_construtor_investidor,
  };
}

function buildClienteUpdate(data: ClienteFormValues) {
  return {
    perfil_id: data.perfil_id ?? null,
    nome: data.nome.trim(),
    telefone: data.telefone.trim(),
    email: data.email?.trim() || null,
    cpf: data.cpf?.trim() || null,
    data_nascimento: data.data_nascimento?.trim() || null,
    profissao: data.profissao?.trim() || null,
    estado_civil: data.estado_civil?.trim() || null,
    observacoes: data.observacoes?.trim() || null,
    tipo: data.tipo,
    eh_construtor_investidor: data.eh_construtor_investidor,
    atualizado_em: new Date().toISOString(),
  };
}

export async function getClientes(): Promise<Cliente[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*, perfil:perfis(id, nome, email, papel)")
    .eq("corretor_id", corretor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[getClientes] failed", error);
    return [];
  }

  return (data ?? []) as Cliente[];
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*, perfil:perfis(id, nome, email, papel)")
    .eq("id", id)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (error) {
    console.error("[getClienteById] failed", error);
    return null;
  }

  return (data as Cliente | null) ?? null;
}

export async function getImoveisByClienteId(clienteId: string): Promise<Imovel[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("*, fotos:imovel_fotos(*)")
    .eq("corretor_id", corretor.id)
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[getImoveisByClienteId] failed", error);
    return [];
  }

  return (data ?? []) as Imovel[];
}

export async function getLeadsByClienteTelefone(telefone: string): Promise<Lead[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const digits = sanitizeTelefone(telefone);
  if (!digits) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[getLeadsByClienteTelefone] failed", error);
    return [];
  }

  return ((data ?? []) as Lead[]).filter((lead) => {
    const leadDigits = sanitizeTelefone(lead.telefone ?? "");
    return leadDigits === digits || leadDigits.endsWith(digits) || digits.endsWith(leadDigits);
  });
}

export async function searchClientes(query: string): Promise<ClienteSearchResult[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const supabase = await createClient();
  const digits = sanitizeTelefone(trimmed);

  let dbQuery = supabase
    .from("clientes")
    .select("id, nome, telefone, email, tipo, eh_construtor_investidor, corretor_id")
    .limit(10);

  if (digits.length >= 4) {
    dbQuery = dbQuery.or(`nome.ilike.%${trimmed}%,telefone.ilike.%${digits}%`);
  } else {
    dbQuery = dbQuery.ilike("nome", `%${trimmed}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[searchClientes] failed", error);
    return [];
  }

  return (data ?? []).map((cliente) => {
    const isOwn = cliente.corretor_id === corretor.id;
    let pode_vincular = isOwn;
    let aviso: string | undefined;

    if (!isOwn) {
      if (cliente.eh_construtor_investidor) {
        pode_vincular = true;
        aviso = "Construtor/investidor — vinculação permitida.";
      } else {
        pode_vincular = false;
        aviso =
          "Esta pessoa já existe no sistema. Solicite ao gerente para transferir o atendimento.";
      }
    }

    return {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      tipo: cliente.tipo as TipoCliente,
      eh_construtor_investidor: cliente.eh_construtor_investidor,
      corretor_id: cliente.corretor_id,
      pode_vincular,
      aviso,
    };
  });
}

export async function createCliente(
  rawData: ClienteFormValues,
): Promise<ClienteActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = clienteFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert(buildClienteInsert(corretor.id, parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createCliente] failed", error);
    return { error: "Não foi possível cadastrar o cliente." };
  }

  revalidatePath("/dashboard/clientes");

  return { success: true, clienteId: data.id };
}

export async function createClienteFromImovel(
  data: {
    nome: string;
    telefone: string;
    email?: string;
    tipo: "proprietario" | "ambos";
    eh_construtor_investidor: boolean;
  },
): Promise<ClienteActionResult> {
  return createCliente({
    nome: data.nome,
    telefone: data.telefone,
    email: data.email ?? "",
    cpf: "",
    data_nascimento: "",
    profissao: "",
    estado_civil: "",
    observacoes: "",
    tipo: data.tipo,
    eh_construtor_investidor: data.eh_construtor_investidor,
    perfil_id: null,
  });
}

export async function updateCliente(
  id: string,
  rawData: ClienteFormValues,
): Promise<ClienteActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = clienteFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(buildClienteUpdate(parsed.data))
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    console.error("[updateCliente] failed", error);
    return { error: "Não foi possível atualizar o cliente." };
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);

  return { success: true, clienteId: id };
}

export async function createClienteAndRedirect(
  rawData: ClienteFormValues,
): Promise<ClienteActionResult> {
  const result = await createCliente(rawData);

  if (result.error || !result.clienteId) {
    return result;
  }

  redirect(`/dashboard/clientes/${result.clienteId}`);
}

export async function deleteCliente(id: string): Promise<ClienteActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    console.error("[deleteCliente] failed", error);
    return { error: "Não foi possível excluir o cliente." };
  }

  revalidatePath("/dashboard/clientes");

  return { success: true };
}
