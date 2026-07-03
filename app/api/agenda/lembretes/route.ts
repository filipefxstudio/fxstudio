import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";

async function enviarEmailResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? "FX Studio <noreply@fxstudio.com.br>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  return response.ok;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agora = new Date();
  const limite = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    console.error("[lembretes] admin client", error);
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  const { data: itens, error } = await supabase
    .from("agenda")
    .select("id, titulo, data_atividade, descricao, corretor:corretores(email, nome)")
    .eq("status", "pendente")
    .eq("lembrete_email", true)
    .eq("lembrete_enviado", false)
    .gte("data_atividade", agora.toISOString())
    .lte("data_atividade", limite.toISOString());

  if (error) {
    console.error("[lembretes] query", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let enviados = 0;

  for (const item of itens ?? []) {
    const corretor = item.corretor as { email?: string; nome?: string } | null;
    const email = corretor?.email;
    const subject = `Lembrete: ${item.titulo}`;
    const html = `<p>Olá${corretor?.nome ? ` ${corretor.nome}` : ""},</p>
<p>Lembrete de atividade: <strong>${item.titulo}</strong></p>
<p>Data: ${new Date(item.data_atividade as string).toLocaleString("pt-BR")}</p>
${item.descricao ? `<p>${item.descricao}</p>` : ""}`;

    if (email) {
      const ok = await enviarEmailResend(email, subject, html);
      if (ok) {
        await supabase.from("agenda").update({ lembrete_enviado: true }).eq("id", item.id);
        enviados += 1;
      } else {
        console.log("[lembretes stub]", { to: email, subject, itemId: item.id });
        await supabase.from("agenda").update({ lembrete_enviado: true }).eq("id", item.id);
        enviados += 1;
      }
    } else {
      console.log("[lembretes stub sem email]", item);
      await supabase.from("agenda").update({ lembrete_enviado: true }).eq("id", item.id);
      enviados += 1;
    }
  }

  return NextResponse.json({ processed: itens?.length ?? 0, enviados });
}
