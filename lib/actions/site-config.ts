"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_SITE_COR_PRIMARIA,
  DEFAULT_SITE_COR_SECUNDARIA,
  STORAGE_BUCKET_SITE_ASSETS,
} from "@/lib/constants/site";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";

export type SiteConfigActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  url?: string;
};

export type SaveIdentidadeVisualInput = {
  site_cor_primaria: string;
  site_cor_secundaria: string;
};

export type SaveSobreInput = {
  sobre_titulo: string;
  sobre_texto: string;
};

export type SaveContatoInput = {
  contato_email: string;
  contato_telefone: string;
  contato_endereco: string;
  contato_horario: string;
};

export type SaveSiteDominioInput = {
  dominio_custom: string;
};

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

async function uploadSiteAsset(
  formData: FormData,
  fieldName: string,
  fileName: string,
): Promise<SiteConfigActionResult & { url?: string }> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const file = formData.get(fieldName) as File | null;

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
  const storagePath = `${corretor.id}/${fileName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET_SITE_ASSETS)
    .upload(storagePath, buffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error(`[uploadSiteAsset:${fileName}]`, uploadError);
    return { error: "Não foi possível enviar a imagem." };
  }

  const { data: publicUrlData } = admin.storage
    .from(STORAGE_BUCKET_SITE_ASSETS)
    .getPublicUrl(storagePath);

  return { success: true, url: publicUrlData.publicUrl, message: "Imagem enviada." };
}

export async function saveIdentidadeVisual(
  data: SaveIdentidadeVisualInput,
): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const primaria = data.site_cor_primaria.trim() || DEFAULT_SITE_COR_PRIMARIA;
  const secundaria = data.site_cor_secundaria.trim() || DEFAULT_SITE_COR_SECUNDARIA;

  if (!isValidHexColor(primaria) || !isValidHexColor(secundaria)) {
    return { error: "Informe cores válidas no formato #RRGGBB." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      site_cor_primaria: primaria,
      site_cor_secundaria: secundaria,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar as cores." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}`);
  }

  return { success: true, message: "Identidade visual salva." };
}

export async function uploadLogo(formData: FormData): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const uploadResult = await uploadSiteAsset(formData, "logo", "logo");

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({ logo_url: uploadResult.url })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a logo." };
  }

  revalidatePath("/dashboard/configuracoes");
  revalidatePath("/dashboard");

  return { success: true, url: uploadResult.url, message: "Logo enviada." };
}

export async function uploadHero(formData: FormData): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const uploadResult = await uploadSiteAsset(formData, "hero", "hero");

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({ hero_image_url: uploadResult.url })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a imagem do hero." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}`);
  }

  return { success: true, url: uploadResult.url, message: "Imagem do hero enviada." };
}

export async function removeHero(): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({ hero_image_url: null })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível remover a imagem do hero." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}`);
  }

  return { success: true, message: "Imagem do hero removida." };
}

export async function uploadSobreFoto(formData: FormData): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const uploadResult = await uploadSiteAsset(formData, "foto", "sobre");

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({ sobre_foto_url: uploadResult.url })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a foto." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}/sobre`);
  }

  return { success: true, url: uploadResult.url, message: "Foto enviada." };
}

export async function saveSobrePage(data: SaveSobreInput): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      sobre_titulo: data.sobre_titulo.trim() || null,
      sobre_texto: data.sobre_texto.trim() || null,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a página Sobre." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}/sobre`);
  }

  return { success: true, message: "Página Sobre salva." };
}

export async function saveContatoPage(data: SaveContatoInput): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      contato_email: data.contato_email.trim() || null,
      contato_telefone: data.contato_telefone.trim() || null,
      contato_endereco: data.contato_endereco.trim() || null,
      contato_horario: data.contato_horario.trim() || null,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a página Contato." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}/contato`);
  }

  return { success: true, message: "Página Contato salva." };
}

export async function saveSiteDominio(data: SaveSiteDominioInput): Promise<SiteConfigActionResult> {
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
    return { error: "Não foi possível salvar o domínio." };
  }

  revalidatePath("/dashboard/configuracoes");

  return { success: true, message: "Domínio salvo." };
}
