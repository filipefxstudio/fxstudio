import { NextResponse } from "next/server";

import { notificarCorretorNovoLead } from "@/lib/site/email";
import { getCorretorByDominio, getCorretorBySlug } from "@/lib/site/queries";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface SiteLeadBody {
  corretor_id?: string;
  tenant_slug?: string;
  hostname?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  imovel_id?: string;
  preferencia_contato?: string;
  origem?: string;
}

async function resolveCorretor(body: SiteLeadBody, tenantHeader: string | null) {
  if (body.corretor_id) {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("corretores")
      .select("id, nome, email, contato_email")
      .eq("id", body.corretor_id)
      .maybeSingle();
    return data;
  }

  const slug = body.tenant_slug ?? tenantHeader;
  if (slug) {
    return getCorretorBySlug(slug);
  }

  if (body.hostname) {
    return getCorretorByDominio(body.hostname);
  }

  return null;
}

export async function POST(request: Request) {
  let body: SiteLeadBody;

  try {
    body = (await request.json()) as SiteLeadBody;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const tenantHeader = request.headers.get("x-tenant-slug");
  const corretor = await resolveCorretor(body, tenantHeader);

  if (!corretor) {
    return NextResponse.json({ error: "Corretor não encontrado." }, { status: 404 });
  }

  const nome = body.nome?.trim() ?? "";
  const telefone = body.telefone?.trim() ?? "";

  if (!nome) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }

  if (!telefone) {
    return NextResponse.json({ error: "Informe seu telefone." }, { status: 400 });
  }

  const observacoesPartes = [body.observacoes?.trim()].filter(Boolean);

  if (body.preferencia_contato?.trim()) {
    observacoesPartes.unshift(`Preferência de contato: ${body.preferencia_contato.trim()}`);
  }

  const observacoes = observacoesPartes.join("\n\n") || null;

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    console.error("[site/leads] admin client", error);
    return NextResponse.json({ error: "Erro de configuração." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      corretor_id: corretor.id,
      imovel_id: body.imovel_id ?? null,
      nome,
      telefone,
      email: body.email?.trim() || null,
      origem: "site",
      etapa: "novo",
      temperatura: "quente",
      atendido_por: "corretor",
      observacoes,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[site/leads] insert failed", error);
    return NextResponse.json({ error: "Não foi possível registrar seu contato." }, { status: 500 });
  }

  const emailDestino = corretor.contato_email ?? corretor.email;
  await notificarCorretorNovoLead({
    email: emailDestino,
    corretorNome: corretor.nome,
    leadNome: nome,
    leadTelefone: telefone,
    observacoes,
  });

  return NextResponse.json({
    success: true,
    leadId: data.id,
    message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
  });
}
