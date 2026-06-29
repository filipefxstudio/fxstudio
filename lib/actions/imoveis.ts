"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { IMOVEL_LIMITS, STORAGE_BUCKET_IMOVEIS } from "@/lib/constants/imoveis";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
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

function buildImovelInsert(
  corretorId: string,
  data: ImovelFormValues,
  slug: string,
) {
  return {
    corretor_id: corretorId,
    titulo: data.titulo.trim(),
    slug,
    tipo: data.tipo,
    finalidade: data.finalidade,
    status: data.status,
    cep: sanitizeCep(data.cep),
    logradouro: data.logradouro.trim(),
    numero: data.numero.trim(),
    complemento: data.complemento?.trim() || null,
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

  const supabase = await createClient();
  const { data: imovel, error: insertError } = await supabase
    .from("imoveis")
    .insert(buildImovelInsert(corretor.id, data, slug))
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
