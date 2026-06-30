"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_MIDIAS_ORIGEM,
  DEFAULT_TIPOS_IMOVEL_CUSTOM,
  EQUIPE_LIMITE_USUARIOS,
} from "@/lib/constants/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { MidiaOrigem, PapelUsuario, Perfil, TipoImovelCustom } from "@/types";

export type ConfigActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

async function ensureTiposDefaults(corretorId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tipo_imovel_custom")
    .select("id", { count: "exact", head: true })
    .eq("corretor_id", corretorId);

  if ((count ?? 0) > 0) {
    return;
  }

  await supabase.from("tipo_imovel_custom").insert(
    DEFAULT_TIPOS_IMOVEL_CUSTOM.map((nome) => ({
      corretor_id: corretorId,
      nome,
      ativo: true,
    })),
  );
}

async function ensureMidiasDefaults(corretorId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("midia_origem")
    .select("id", { count: "exact", head: true })
    .eq("corretor_id", corretorId);

  if ((count ?? 0) > 0) {
    return;
  }

  await supabase.from("midia_origem").insert(
    DEFAULT_MIDIAS_ORIGEM.map((nome, ordem) => ({
      corretor_id: corretorId,
      nome,
      ordem,
      ativo: true,
    })),
  );
}

export async function getTiposImovelCustom(): Promise<TipoImovelCustom[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  await ensureTiposDefaults(corretor.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tipo_imovel_custom")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("nome");

  if (error) {
    console.error("[getTiposImovelCustom] failed", error);
    return [];
  }

  return (data ?? []) as TipoImovelCustom[];
}

export async function getMidiasOrigem(): Promise<MidiaOrigem[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  await ensureMidiasDefaults(corretor.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("midia_origem")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("ordem");

  if (error) {
    console.error("[getMidiasOrigem] failed", error);
    return [];
  }

  return (data ?? []) as MidiaOrigem[];
}

export async function getPerfisEquipe(): Promise<Perfil[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("criado_em");

  if (error) {
    console.error("[getPerfisEquipe] failed", error);
    return [];
  }

  return (data ?? []) as Perfil[];
}

export async function addTipoImovelCustom(nome: string): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const trimmed = nome.trim();
  if (!trimmed) {
    return { error: "Informe o nome do tipo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tipo_imovel_custom").insert({
    corretor_id: corretor.id,
    nome: trimmed,
    ativo: true,
  });

  if (error) {
    return { error: "Não foi possível adicionar o tipo." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Tipo adicionado." };
}

export async function toggleTipoImovelCustom(
  id: string,
  ativo: boolean,
): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tipo_imovel_custom")
    .update({ ativo })
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    return { error: "Não foi possível atualizar o tipo." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}

export async function addMidiaOrigem(nome: string): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const trimmed = nome.trim();
  if (!trimmed) {
    return { error: "Informe o nome da mídia." };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("midia_origem")
    .select("ordem")
    .eq("corretor_id", corretor.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordem = (last?.ordem ?? -1) + 1;

  const { error } = await supabase.from("midia_origem").insert({
    corretor_id: corretor.id,
    nome: trimmed,
    ordem,
    ativo: true,
  });

  if (error) {
    return { error: "Não foi possível adicionar a mídia." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Mídia adicionada." };
}

export async function toggleMidiaOrigem(
  id: string,
  ativo: boolean,
): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("midia_origem")
    .update({ ativo })
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    return { error: "Não foi possível atualizar a mídia." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}

export async function reorderMidiasOrigem(
  orderedIds: string[],
): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();

  for (let index = 0; index < orderedIds.length; index += 1) {
    await supabase
      .from("midia_origem")
      .update({ ordem: index })
      .eq("id", orderedIds[index])
      .eq("corretor_id", corretor.id);
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}

export async function convidarPerfil(data: {
  nome: string;
  email: string;
  telefone?: string;
  papel: PapelUsuario;
}): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const perfis = await getPerfisEquipe();

  if (perfis.length >= EQUIPE_LIMITE_USUARIOS) {
    return { error: `Limite de ${EQUIPE_LIMITE_USUARIOS} usuários atingido.` };
  }

  const nome = data.nome.trim();
  const email = data.email.trim();

  if (!nome || !email) {
    return { error: "Informe nome e e-mail." };
  }

  // MVP: stub invite — perfil created without auth user link
  const supabase = await createClient();
  const { error } = await supabase.from("perfis").insert({
    corretor_id: corretor.id,
    user_id: corretor.user_id,
    nome,
    email,
    telefone: data.telefone?.trim() || null,
    papel: data.papel,
    ativo: false,
  });

  if (error) {
    console.error("[convidarPerfil] failed", error);
    return { error: "Não foi possível registrar o convite." };
  }

  revalidatePath("/dashboard/configuracoes");
  return {
    success: true,
    message: "Convite enviado! O usuário receberá um e-mail com link de acesso.",
  };
}

export async function togglePerfilAtivo(
  id: string,
  ativo: boolean,
): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ ativo })
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    return { error: "Não foi possível atualizar o perfil." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}
