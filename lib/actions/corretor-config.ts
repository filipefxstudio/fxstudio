"use server";

import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type SavePerfilInput = {
  nome: string;
  telefone: string;
  creci: string;
};

export type SaveWhatsAppInput = {
  zapi_instance_id: string;
  zapi_token: string;
};

export type SaveSiteInput = {
  dominio_custom: string;
};

export async function savePerfilCorretor(data: SavePerfilInput): Promise<ActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const nome = data.nome.trim();

  if (!nome) {
    return { error: "Informe seu nome." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      nome,
      telefone: data.telefone.trim() || null,
      creci: data.creci.trim() || null,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar seu perfil." };
  }

  return { success: true, message: "Perfil atualizado com sucesso." };
}

export async function saveWhatsAppConfig(data: SaveWhatsAppInput): Promise<ActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const zapiInstanceId = data.zapi_instance_id.trim();
  const zapiToken = data.zapi_token.trim();

  if (!zapiInstanceId || !zapiToken) {
    return { error: "Preencha o ID da instância e o token da Z-API." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      zapi_instance_id: zapiInstanceId,
      zapi_token: zapiToken,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar as configurações do WhatsApp." };
  }

  return { success: true, message: "WhatsApp configurado com sucesso." };
}

export async function saveSiteConfig(data: SaveSiteInput): Promise<ActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      dominio_custom: data.dominio_custom.trim() || null,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar as configurações do site." };
  }

  return { success: true, message: "Configurações do site salvas." };
}
