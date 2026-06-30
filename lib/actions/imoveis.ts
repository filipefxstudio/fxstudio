"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { IMOVEL_LIMITS, STORAGE_BUCKET_IMOVEIS } from "@/lib/constants/imoveis";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import { createClienteFromImovel } from "@/lib/actions/clientes";
import { buildComplementoString } from "@/lib/imoveis/form";
import { generateImovelSlug } from "@/lib/utils";
import { imovelFormSchema, type ImovelFormValues } from "@/lib/validations/imovel";
import type { Imovel, PlanoAssinatura } from "@/types";

export type ImovelActionResult = {
  success?: boolean;
  error?: string;
  imovelId?: string;
};

export type FotoUploadInput = {
  file: File;
  legenda?: string;
  ordem: number;
};

export type FotoUpdateInput = {
  existingId?: string;
  file?: File;
  legenda?: string;
  ordem: number;
};

async function getPlanoAtivo(corretorId: string): Promise<PlanoAssinatura> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assinaturas")
    .select("plano, status")
    .eq("corretor_id", corretorId)
    .eq("status", "ativo")
    .maybeSingle();

  return (data?.plano as PlanoAssinatura | undefined) ?? "basico";
}

async function countImoveis(corretorId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("corretor_id", corretorId);

  if (error) {
    throw new Error("Não foi possível verificar a quantidade de imóveis.");
  }

  return count ?? 0;
}

async function ensureUniqueImovelSlug(
  corretorId: string,
  baseSlug: string,
): Promise<string> {
  const supabase = await createClient();
  const normalizedBase = baseSlug || "imovel";
  let slug = normalizedBase;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("imoveis")
      .select("id")
      .eq("corretor_id", corretorId)
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      return slug;
    }

    slug = `${normalizedBase}-${counter}`;
    counter += 1;
  }
}

function sanitizeCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

function extractStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET_IMOVEIS}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return url.slice(index + marker.length);
}

async function ensureImovelOwnership(imovelId: string, corretorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("id")
    .eq("id", imovelId)
    .eq("corretor_id", corretorId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

async function ensureUniqueImovelSlugForUpdate(
  corretorId: string,
  baseSlug: string,
  currentImovelId: string,
): Promise<string> {
  const supabase = await createClient();
  const normalizedBase = baseSlug || "imovel";
  let slug = normalizedBase;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("imoveis")
      .select("id")
      .eq("corretor_id", corretorId)
      .eq("slug", slug)
      .maybeSingle();

    if (!data || data.id === currentImovelId) {
      return slug;
    }

    slug = `${normalizedBase}-${counter}`;
    counter += 1;
  }
}

async function generateNextCodigo(corretorId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("codigo")
    .eq("corretor_id", corretorId)
    .not("codigo", "is", null);

  if (error) {
    console.error("[generateNextCodigo] failed", error);
    throw new Error("Não foi possível gerar o código do imóvel.");
  }

  let max = 0;
  for (const row of data ?? []) {
    const num = parseInt(row.codigo ?? "", 10);
    if (!Number.isNaN(num) && num > max) {
      max = num;
    }
  }

  return String(max + 1).padStart(4, "0");
}

export async function getProximoCodigoPreview(): Promise<string | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  try {
    return await generateNextCodigo(corretor.id);
  } catch {
    return null;
  }
}

function buildImovelFields(data: ImovelFormValues) {
  const complemento = buildComplementoString(data);

  return {
    codigo_personalizado: data.codigo_personalizado?.trim() || null,
    complemento: complemento || null,
    complemento_tipo: data.complemento_tipo?.trim() || null,
    complemento_numero: data.complemento_numero?.trim() || null,
    complemento_torre: data.complemento_torre?.trim() || null,
    condominio_nome: data.condominio_nome?.trim() || null,
    portal_endereco_diferente: data.portal_endereco_diferente,
    portal_logradouro: data.portal_endereco_diferente
      ? data.portal_logradouro?.trim() || null
      : null,
    portal_numero: data.portal_endereco_diferente
      ? data.portal_numero?.trim() || null
      : null,
    portal_bairro: data.portal_endereco_diferente
      ? data.portal_bairro?.trim() || null
      : null,
    local_chaves: data.local_chaves,
    chaves_codigo:
      data.local_chaves === "imobiliaria" ? data.chaves_codigo?.trim() || null : null,
    chaves_descricao:
      data.local_chaves === "outros" ? data.chaves_descricao?.trim() || null : null,
    exclusividade: data.exclusividade,
    imovel_ocupado: data.imovel_ocupado,
    contrato_aluguel_ativo: data.contrato_aluguel_ativo,
    aceita_financiamento: data.aceita_financiamento,
    aceita_permuta: data.aceita_permuta,
    imovel_na_planta: data.imovel_na_planta,
    ano_construcao: data.ano_construcao,
    salas: data.salas,
    elevadores: data.elevadores,
    vagas_tipo: data.vagas_tipo?.trim() || null,
    vagas_cobertura: data.vagas_cobertura?.trim() || null,
    cliente_id: data.cliente_id ?? null,
  };
}

function buildImovelInsert(
  corretorId: string,
  data: ImovelFormValues,
  slug: string,
  codigo: string,
  clienteId: string | null,
) {
  return {
    corretor_id: corretorId,
    codigo,
    titulo: data.titulo.trim(),
    slug,
    tipo: data.tipo,
    finalidade: data.finalidade,
    status: data.status,
    cep: sanitizeCep(data.cep),
    logradouro: data.logradouro.trim(),
    numero: data.numero.trim(),
    bairro: data.bairro.trim(),
    cidade: data.cidade.trim(),
    estado: data.estado,
    latitude: data.latitude,
    longitude: data.longitude,
    area_util: data.area_util,
    area_total: data.area_total,
    quartos: data.quartos,
    suites: data.suites,
    banheiros: data.banheiros,
    vagas: data.vagas,
    valor_venda: data.finalidade === "venda" ? data.valor_venda : null,
    valor_locacao: data.finalidade === "locacao" ? data.valor_locacao : null,
    valor_condominio: data.valor_condominio,
    valor_iptu: data.valor_iptu,
    descricao: data.descricao?.trim() || null,
    diferenciais: data.diferenciais.length > 0 ? data.diferenciais : null,
    video_url: data.video_url?.trim() || null,
    publicado_site: data.publicado_site,
    visualizacoes: 0,
    ...buildImovelFields(data),
    cliente_id: clienteId,
  };
}

function buildImovelUpdate(data: ImovelFormValues, slug: string, clienteId: string | null) {
  return {
    titulo: data.titulo.trim(),
    slug,
    tipo: data.tipo,
    finalidade: data.finalidade,
    status: data.status,
    cep: sanitizeCep(data.cep),
    logradouro: data.logradouro.trim(),
    numero: data.numero.trim(),
    bairro: data.bairro.trim(),
    cidade: data.cidade.trim(),
    estado: data.estado,
    latitude: data.latitude,
    longitude: data.longitude,
    area_util: data.area_util,
    area_total: data.area_total,
    quartos: data.quartos,
    suites: data.suites,
    banheiros: data.banheiros,
    vagas: data.vagas,
    valor_venda: data.finalidade === "venda" ? data.valor_venda : null,
    valor_locacao: data.finalidade === "locacao" ? data.valor_locacao : null,
    valor_condominio: data.valor_condominio,
    valor_iptu: data.valor_iptu,
    descricao: data.descricao?.trim() || null,
    diferenciais: data.diferenciais.length > 0 ? data.diferenciais : null,
    video_url: data.video_url?.trim() || null,
    publicado_site: data.publicado_site,
    ...buildImovelFields(data),
    cliente_id: clienteId,
  };
}

async function resolveClienteId(data: ImovelFormValues): Promise<string | null> {
  if (data.cliente_id) {
    return data.cliente_id;
  }

  if (!data.proprietario_novo) {
    return null;
  }

  const result = await createClienteFromImovel(data.proprietario_novo);

  if (result.error || !result.clienteId) {
    throw new Error(result.error ?? "Não foi possível cadastrar o proprietário.");
  }

  return result.clienteId;
}

export async function checkImovelDuplicado(
  cep: string,
  numero: string,
  complemento: string,
  excludeId?: string,
): Promise<{ duplicado: boolean; imovelId?: string; titulo?: string }> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { duplicado: false };
  }

  const supabase = await createClient();
  const sanitizedCep = sanitizeCep(cep);
  const normalizedComplemento = complemento.trim().toLowerCase();

  let query = supabase
    .from("imoveis")
    .select("id, titulo, complemento, complemento_numero, complemento_tipo")
    .eq("corretor_id", corretor.id)
    .eq("cep", sanitizedCep)
    .eq("numero", numero.trim());

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return { duplicado: false };
  }

  const match = data.find((imovel) => {
    const existing =
      imovel.complemento?.trim().toLowerCase() ??
      [imovel.complemento_tipo, imovel.complemento_numero]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase();
    return existing === normalizedComplemento;
  });

  if (!match) {
    return { duplicado: false };
  }

  return {
    duplicado: true,
    imovelId: match.id,
    titulo: match.titulo ?? undefined,
  };
}

export async function getImoveis(): Promise<Imovel[]> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("*, fotos:imovel_fotos(*)")
    .eq("corretor_id", corretor.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[getImoveis] failed", error);
    return [];
  }

  return (data ?? []) as Imovel[];
}

export async function getImovelById(id: string): Promise<Imovel | null> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imoveis")
    .select("*, fotos:imovel_fotos(*)")
    .eq("id", id)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (error) {
    console.error("[getImovelById] failed", error);
    return null;
  }

  return (data as Imovel | null) ?? null;
}

export async function updatePublicadoSite(
  id: string,
  publicado: boolean,
): Promise<ImovelActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const owns = await ensureImovelOwnership(id, corretor.id);

  if (!owns) {
    return { error: "Imóvel não encontrado." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("imoveis")
    .update({ publicado_site: publicado })
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (error) {
    console.error("[updatePublicadoSite] failed", error);
    return { error: "Não foi possível atualizar a publicação." };
  }

  revalidatePath("/dashboard/imoveis");
  revalidatePath(`/dashboard/imoveis/${id}`);

  return { success: true, imovelId: id };
}

export async function deleteImovel(id: string): Promise<ImovelActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { data: imovel, error: fetchError } = await supabase
    .from("imoveis")
    .select("id, fotos:imovel_fotos(id, url)")
    .eq("id", id)
    .eq("corretor_id", corretor.id)
    .maybeSingle();

  if (fetchError || !imovel) {
    return { error: "Imóvel não encontrado." };
  }

  const fotos = (imovel.fotos ?? []) as { id: string; url: string }[];
  const storagePaths = fotos
    .map((foto) => extractStoragePathFromUrl(foto.url))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    try {
      const admin = createServiceRoleClient();
      await admin.storage.from(STORAGE_BUCKET_IMOVEIS).remove(storagePaths);
    } catch (error) {
      console.error("[deleteImovel] storage cleanup failed", error);
    }
  }

  const { error: deleteError } = await supabase
    .from("imoveis")
    .delete()
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (deleteError) {
    console.error("[deleteImovel] failed", deleteError);
    return { error: "Não foi possível excluir o imóvel." };
  }

  revalidatePath("/dashboard/imoveis");

  return { success: true };
}

async function uploadFotosForImovel(
  corretorId: string,
  imovelId: string,
  fotos: FotoUploadInput[],
): Promise<ImovelActionResult | null> {
  if (fotos.length === 0) {
    return null;
  }

  const supabase = await createClient();
  let admin;

  try {
    admin = createServiceRoleClient();
  } catch (error) {
    console.error("[uploadFotosForImovel] service role client failed", error);
    return {
      error: "Upload de fotos indisponível. Verifique a configuração do Supabase Storage.",
    };
  }

  const sortedFotos = [...fotos].sort((a, b) => a.ordem - b.ordem);

  for (const foto of sortedFotos) {
    const extension = foto.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `${corretorId}/${imovelId}/${filename}`;
    const buffer = Buffer.from(await foto.file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET_IMOVEIS)
      .upload(storagePath, buffer, {
        contentType: foto.file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadFotosForImovel] upload failed", uploadError);
      return { error: "Não foi possível enviar as fotos. Tente novamente." };
    }

    const { data: publicUrlData } = admin.storage
      .from(STORAGE_BUCKET_IMOVEIS)
      .getPublicUrl(storagePath);

    const { error: fotoInsertError } = await supabase.from("imovel_fotos").insert({
      imovel_id: imovelId,
      url: publicUrlData.publicUrl,
      ordem: foto.ordem,
      legenda: foto.legenda?.trim() || null,
    });

    if (fotoInsertError) {
      console.error("[uploadFotosForImovel] foto insert failed", fotoInsertError);
      return { error: "Não foi possível salvar as fotos do imóvel." };
    }
  }

  return null;
}

export async function createImovel(
  rawData: ImovelFormValues,
  fotos: FotoUploadInput[],
): Promise<ImovelActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = imovelFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Dados do imóvel inválidos." };
  }

  const data = parsed.data;

  try {
    const plano = await getPlanoAtivo(corretor.id);
    const limite = IMOVEL_LIMITS[plano];

    if (limite !== null) {
      const total = await countImoveis(corretor.id);

      if (total >= limite) {
        return {
          error: `Seu plano ${plano === "basico" ? "Básico" : plano} permite até ${limite} imóveis. Faça upgrade para cadastrar mais.`,
        };
      }
    }
  } catch (error) {
    console.error("[createImovel] limit check failed", error);
    return { error: "Não foi possível verificar o limite do seu plano." };
  }

  const baseSlug = generateImovelSlug(data.titulo, data.cidade);
  const slug = await ensureUniqueImovelSlug(corretor.id, baseSlug);

  let codigo: string;
  try {
    codigo = await generateNextCodigo(corretor.id);
  } catch (error) {
    console.error("[createImovel] codigo generation failed", error);
    return { error: "Não foi possível gerar o código do imóvel." };
  }

  const supabase = await createClient();

  let clienteId: string | null = null;
  try {
    clienteId = await resolveClienteId(data);
  } catch (error) {
    console.error("[createImovel] proprietario failed", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível vincular o proprietário.",
    };
  }

  const { data: imovel, error: insertError } = await supabase
    .from("imoveis")
    .insert(buildImovelInsert(corretor.id, data, slug, codigo, clienteId))
    .select("id")
    .single();

  if (insertError || !imovel) {
    console.error("[createImovel] insert failed", insertError);
    return { error: "Não foi possível cadastrar o imóvel. Tente novamente." };
  }

  const uploadedPaths: string[] = [];

  if (fotos.length > 0) {
    let admin;

    try {
      admin = createServiceRoleClient();
    } catch (error) {
      console.error("[createImovel] service role client failed", error);
      await supabase.from("imoveis").delete().eq("id", imovel.id);
      return {
        error:
          "Upload de fotos indisponível. Verifique a configuração do Supabase Storage.",
      };
    }

    const sortedFotos = [...fotos].sort((a, b) => a.ordem - b.ordem);

    for (const foto of sortedFotos) {
      const extension = foto.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filename = `${crypto.randomUUID()}.${extension}`;
      const storagePath = `${corretor.id}/${imovel.id}/${filename}`;
      const buffer = Buffer.from(await foto.file.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from(STORAGE_BUCKET_IMOVEIS)
        .upload(storagePath, buffer, {
          contentType: foto.file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("[createImovel] upload failed", uploadError);

        if (uploadedPaths.length > 0) {
          await admin.storage.from(STORAGE_BUCKET_IMOVEIS).remove(uploadedPaths);
        }

        await supabase.from("imoveis").delete().eq("id", imovel.id);

        if (uploadError.message.toLowerCase().includes("bucket")) {
          return {
            error:
              "Bucket de fotos não encontrado. Crie o bucket imoveis-fotos no Supabase (veja instruções na documentação).",
          };
        }

        return { error: "Não foi possível enviar as fotos. Tente novamente." };
      }

      uploadedPaths.push(storagePath);

      const { data: publicUrlData } = admin.storage
        .from(STORAGE_BUCKET_IMOVEIS)
        .getPublicUrl(storagePath);

      const { error: fotoInsertError } = await supabase.from("imovel_fotos").insert({
        imovel_id: imovel.id,
        url: publicUrlData.publicUrl,
        ordem: foto.ordem,
        legenda: foto.legenda?.trim() || null,
      });

      if (fotoInsertError) {
        console.error("[createImovel] foto insert failed", fotoInsertError);

        if (uploadedPaths.length > 0) {
          await admin.storage.from(STORAGE_BUCKET_IMOVEIS).remove(uploadedPaths);
        }

        await supabase.from("imoveis").delete().eq("id", imovel.id);
        return { error: "Não foi possível salvar as fotos do imóvel." };
      }
    }
  }

  revalidatePath("/dashboard/imoveis");
  redirect("/dashboard/imoveis");
}

export async function updateImovel(
  id: string,
  rawData: ImovelFormValues,
  fotos: FotoUpdateInput[],
): Promise<ImovelActionResult> {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const owns = await ensureImovelOwnership(id, corretor.id);

  if (!owns) {
    return { error: "Imóvel não encontrado." };
  }

  const parsed = imovelFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Dados do imóvel inválidos." };
  }

  const data = parsed.data;
  const baseSlug = generateImovelSlug(data.titulo, data.cidade);
  const slug = await ensureUniqueImovelSlugForUpdate(corretor.id, baseSlug, id);

  const supabase = await createClient();

  let clienteId: string | null = null;
  try {
    clienteId = await resolveClienteId(data);
  } catch (error) {
    console.error("[updateImovel] proprietario failed", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível vincular o proprietário.",
    };
  }

  const { error: updateError } = await supabase
    .from("imoveis")
    .update(buildImovelUpdate(data, slug, clienteId))
    .eq("id", id)
    .eq("corretor_id", corretor.id);

  if (updateError) {
    console.error("[updateImovel] update failed", updateError);
    return { error: "Não foi possível atualizar o imóvel." };
  }

  const { data: existingFotos, error: fotosError } = await supabase
    .from("imovel_fotos")
    .select("id, url")
    .eq("imovel_id", id);

  if (fotosError) {
    console.error("[updateImovel] fetch fotos failed", fotosError);
    return { error: "Não foi possível atualizar as fotos." };
  }

  const keptExistingIds = new Set(
    fotos.filter((foto) => foto.existingId).map((foto) => foto.existingId as string),
  );

  const removedFotos = (existingFotos ?? []).filter((foto) => !keptExistingIds.has(foto.id));

  if (removedFotos.length > 0) {
    const storagePaths = removedFotos
      .map((foto) => extractStoragePathFromUrl(foto.url))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      try {
        const admin = createServiceRoleClient();
        await admin.storage.from(STORAGE_BUCKET_IMOVEIS).remove(storagePaths);
      } catch (error) {
        console.error("[updateImovel] storage cleanup failed", error);
      }
    }

    await supabase
      .from("imovel_fotos")
      .delete()
      .in(
        "id",
        removedFotos.map((foto) => foto.id),
      );
  }

  for (const foto of fotos) {
    if (foto.existingId) {
      await supabase
        .from("imovel_fotos")
        .update({
          ordem: foto.ordem,
          legenda: foto.legenda?.trim() || null,
        })
        .eq("id", foto.existingId)
        .eq("imovel_id", id);
    }
  }

  const newFotos: FotoUploadInput[] = fotos
    .filter((foto): foto is FotoUpdateInput & { file: File } => Boolean(foto.file))
    .map((foto) => ({
      file: foto.file,
      legenda: foto.legenda,
      ordem: foto.ordem,
    }));

  const uploadResult = await uploadFotosForImovel(corretor.id, id, newFotos);

  if (uploadResult?.error) {
    return uploadResult;
  }

  revalidatePath("/dashboard/imoveis");
  revalidatePath(`/dashboard/imoveis/${id}`);
  redirect(`/dashboard/imoveis/${id}`);
}
