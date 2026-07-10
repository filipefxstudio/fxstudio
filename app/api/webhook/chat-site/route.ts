import { NextResponse } from "next/server";

import { getCorretorBySlug } from "@/lib/site/queries";
import { getWhatsAppNumber } from "@/lib/site/whatsapp";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enviarMensagemZAPI } from "@/lib/zapi/client";

interface ChatSiteBody {
  nome?: string;
  mensagem?: string;
  corretor_slug?: string;
}

export async function POST(request: Request) {
  let body: ChatSiteBody;

  try {
    body = (await request.json()) as ChatSiteBody;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const nome = body.nome?.trim() ?? "";
  const mensagem = body.mensagem?.trim() ?? "";
  const slug = body.corretor_slug?.trim();

  if (!nome) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }

  if (!mensagem) {
    return NextResponse.json({ error: "Informe sua mensagem." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Corretor não identificado." }, { status: 400 });
  }

  const corretorPublico = await getCorretorBySlug(slug);
  if (!corretorPublico) {
    return NextResponse.json({ error: "Corretor não encontrado." }, { status: 404 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Erro de configuração." }, { status: 500 });
  }

  const { data: corretor } = await admin
    .from("corretores")
    .select("id, zapi_instance_id, zapi_token, whatsapp, telefone")
    .eq("id", corretorPublico.id)
    .maybeSingle();

  if (!corretor?.zapi_instance_id?.trim() || !corretor.zapi_token?.trim()) {
    return NextResponse.json(
      { error: "Configure o WhatsApp nas configurações." },
      { status: 503 },
    );
  }

  const telefoneDestino = getWhatsAppNumber({
    ...corretorPublico,
    whatsapp: corretor.whatsapp,
    telefone: corretor.telefone,
  });

  if (!telefoneDestino) {
    return NextResponse.json(
      { error: "Configure o WhatsApp nas configurações." },
      { status: 503 },
    );
  }

  const texto = `💬 Site: ${nome} diz: ${mensagem}`;

  try {
    await enviarMensagemZAPI(
      corretor.zapi_instance_id,
      corretor.zapi_token,
      telefoneDestino,
      texto,
    );
  } catch (error) {
    console.error("[chat-site] Z-API failed", error);
    return NextResponse.json(
      { error: "Configure o WhatsApp nas configurações." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Mensagem enviada! Retornaremos em breve.",
  });
}
