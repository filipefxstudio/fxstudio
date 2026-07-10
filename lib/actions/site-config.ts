"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_SITE_COR_PRIMARIA,
  DEFAULT_SITE_COR_SECUNDARIA,
  DEFAULT_SITE_TARJA_COR,
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
  site_tarja_cor: string;
};

export type SaveHeroPageInput = {
  hero_titulo: string;
  hero_subtitulo: string;
};

export type SaveSobreInput = {
  site_sobre_titulo: string;
  site_sobre_texto: string;
};

export type SaveContatoInput = {
  site_nome_exibicao: string;
  site_creci: string;
  site_telefone_vendas: string;
  site_telefone_locacao: string;
  site_email: string;
  site_instagram: string;
  site_youtube: string;
  site_tiktok: string;
  site_linkedin: string;
  site_facebook: string;
  site_horario: string;
  site_endereco: string;
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
  const tarja = data.site_tarja_cor.trim() || DEFAULT_SITE_TARJA_COR;

  if (!isValidHexColor(primaria) || !isValidHexColor(secundaria) || !isValidHexColor(tarja)) {
    return { error: "Informe cores válidas no formato #RRGGBB." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      site_cor_primaria: primaria,
      site_cor_secundaria: secundaria,
      site_tarja_cor: tarja,
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

export async function uploadFavicon(formData: FormData): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const uploadResult = await uploadSiteAsset(formData, "favicon", "favicon");
  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({ site_favicon_url: uploadResult.url })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar o favicon." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: true, url: uploadResult.url, message: "Favicon enviado." };
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

export async function saveHeroPage(data: SaveHeroPageInput): Promise<SiteConfigActionResult> {
  const corretor = await getCorretorForUser();
  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update({
      hero_titulo: data.hero_titulo.trim() || null,
      hero_subtitulo: data.hero_subtitulo.trim() || null,
    })
    .eq("id", corretor.id);

  if (error) {
    return { error: "Não foi possível salvar a página inicial." };
  }

  revalidatePath("/dashboard/configuracoes");
  if (corretor.slug) {
    revalidatePath(`/${corretor.slug}`);
  }

  return { success: true, message: "Página inicial salva." };
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
    .update({ site_sobre_foto_url: uploadResult.url })
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
      site_sobre_titulo: data.site_sobre_titulo.trim() || null,
      site_sobre_texto: data.site_sobre_texto.trim() || null,
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
      site_nome_exibicao: data.site_nome_exibicao.trim() || null,
      site_creci: data.site_creci.trim() || null,
      site_telefone_vendas: data.site_telefone_vendas.trim() || null,
      site_telefone_locacao: data.site_telefone_locacao.trim() || null,
      site_email: data.site_email.trim() || null,
      site_instagram: data.site_instagram.trim() || null,
      site_youtube: data.site_youtube.trim() || null,
      site_tiktok: data.site_tiktok.trim() || null,
      site_linkedin: data.site_linkedin.trim() || null,
      site_facebook: data.site_facebook.trim() || null,
      site_horario: data.site_horario.trim() || null,
      site_endereco: data.site_endereco.trim() || null,
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
