"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_MIDIAS_ORIGEM,
  DEFAULT_TIPOS_IMOVEL_CUSTOM,
  EQUIPE_LIMITE_USUARIOS,
  MOTIVOS_DESATIVACAO,
  STORAGE_BUCKET_MARCA_DAGUA,
} from "@/lib/constants/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MarcaDaguaConfig, MidiaOrigem, MotivoDesativacao, PapelUsuario, Perfil, StatusImovel, TipoImovelCustom } from "@/types";

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

export async function getStatusImovelConfig(): Promise<StatusImovel[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("status_imovel")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("ordem");

  if (error) {
    console.error("[getStatusImovelConfig] failed", error);
    return [];
  }

  return (data ?? []) as StatusImovel[];
}

export async function addStatusImovel(data: {
  nome: string;
  cor: string;
  ordem?: number;
}): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const nome = data.nome.trim();
  if (!nome) {
    return { error: "Informe o nome do status." };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("status_imovel")
    .select("ordem")
    .eq("corretor_id", corretor.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordem = data.ordem ?? (last?.ordem ?? 0) + 1;

  const { error } = await supabase.from("status_imovel").insert({
    corretor_id: corretor.id,
    nome,
    cor: data.cor,
    padrao: false,
    ativo: true,
    ordem,
  });

  if (error) {
    return { error: "Não foi possível adicionar o status." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Status adicionado." };
}

export async function updateStatusImovel(
  id: string,
  data: { nome?: string; cor?: string; ordem?: number; ativo?: boolean },
): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("status_imovel")
    .update(data)
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    return { error: "Não foi possível atualizar o status." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}

export async function deleteStatusImovel(id: string): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { data: status } = await supabase
    .from("status_imovel")
    .select("padrao")
    .eq("id", id)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (!status) {
    return { error: "Status não encontrado." };
  }

  if (status.padrao) {
    return { error: "Status padrão não podem ser excluídos. Desative-o em vez disso." };
  }

  const { error } = await supabase
    .from("status_imovel")
    .delete()
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    return { error: "Não foi possível excluir o status." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}

export async function getMarcaDaguaConfig(): Promise<MarcaDaguaConfig | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("marca_dagua_config")
    .select("*")
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  return (data as MarcaDaguaConfig | null) ?? null;
}

export async function saveMarcaDaguaConfig(data: {
  tamanho_percent: number;
  opacidade_percent: number;
  posicao: string;
}): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const existing = await getMarcaDaguaConfig();

  if (existing) {
    const { error } = await supabase
      .from("marca_dagua_config")
      .update({
        ...data,
        atualizado_em: new Date().toISOString(),
      })
      .eq("corretor_id", corretor.id);

    if (error) {
      return { error: "Não foi possível salvar a configuração." };
    }
  } else {
    const { error } = await supabase.from("marca_dagua_config").insert({
      corretor_id: corretor.id,
      ...data,
    });

    if (error) {
      return { error: "Não foi possível salvar a configuração." };
    }
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Configurações salvas." };
}

export async function uploadMarcaDaguaLogo(
  formData: FormData,
): Promise<ConfigActionResult & { logoUrl?: string }> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada." };
  }

  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  let admin;

  try {
    admin = createServiceRoleClient();
  } catch {
    return { error: "Upload indisponível. Verifique a configuração do Supabase Storage." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const storagePath = `${corretor.id}/logo.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET_MARCA_DAGUA)
    .upload(storagePath, buffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("[uploadMarcaDaguaLogo] failed", uploadError);
    return { error: "Não foi possível enviar a logo." };
  }

  const { data: publicUrlData } = admin.storage
    .from(STORAGE_BUCKET_MARCA_DAGUA)
    .getPublicUrl(storagePath);

  const logoUrl = publicUrlData.publicUrl;
  const supabase = await createClient();
  const existing = await getMarcaDaguaConfig();

  if (existing) {
    await supabase
      .from("marca_dagua_config")
      .update({ logo_url: logoUrl, atualizado_em: new Date().toISOString() })
      .eq("corretor_id", corretor.id);
  } else {
    await supabase.from("marca_dagua_config").insert({
      corretor_id: corretor.id,
      logo_url: logoUrl,
    });
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, logoUrl, message: "Logo enviada." };
}

// ---------------------------------------------------------------------------
// Motivos de desativação de imóvel
// ---------------------------------------------------------------------------

async function seedMotivosDesativacao(corretorId: string) {
  const supabase = await createClient();
  const rows = MOTIVOS_DESATIVACAO.map((nome, ordem) => ({
    corretor_id: corretorId,
    nome,
    ordem,
    ativo: true,
  }));
  await supabase.from("motivos_desativacao").insert(rows);
}

export async function getMotivosDesativacao(): Promise<MotivoDesativacao[]> {
  const corretor = await getCorretorForUser();
  if (!corretor) return [];

  const supabase = await createClient();
  const { count } = await supabase
    .from("motivos_desativacao")
    .select("id", { count: "exact", head: true })
    .eq("corretor_id", corretor.id);

  if ((count ?? 0) === 0) {
    await seedMotivosDesativacao(corretor.id);
  }

  const { data, error } = await supabase
    .from("motivos_desativacao")
    .select("*")
    .eq("corretor_id", corretor.id)
    .order("ordem");

  if (error) {
    console.error("[getMotivosDesativacao] failed", error);
    return [];
  }

  return (data ?? []) as MotivoDesativacao[];
}

export async function saveMotivoDesativacao(input: {
  id?: string;
  nome: string;
  ativo?: boolean;
}): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome do motivo." };

  const supabase = await createClient();

  if (input.id) {
    const { error } = await supabase
      .from("motivos_desativacao")
      .update({ nome, ativo: input.ativo ?? true })
      .eq("id", input.id)
      .eq("corretor_id", corretor.id);
    if (error) return { error: "Não foi possível salvar." };
  } else {
    const { count } = await supabase
      .from("motivos_desativacao")
      .select("id", { count: "exact", head: true })
      .eq("corretor_id", corretor.id);
    const { error } = await supabase.from("motivos_desativacao").insert({
      corretor_id: corretor.id,
      nome,
      ordem: count ?? 0,
      ativo: true,
    });
    if (error) return { error: "Não foi possível adicionar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, message: "Motivo salvo." };
}

export async function deleteMotivoDesativacao(id: string): Promise<ConfigActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("motivos_desativacao")
    .delete()
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) return { error: "Não foi possível excluir." };

  revalidatePath("/dashboard/configuracoes");
  return { success: true };
}
