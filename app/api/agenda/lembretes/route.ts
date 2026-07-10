import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/resend";
import { createServiceRoleClient } from "@/lib/supabase/admin";

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
      const result = await sendEmail("enviarLembreteAgenda", email, subject, html);
      if (result.success) {
        await supabase.from("agenda").update({ lembrete_enviado: true }).eq("id", item.id);
        enviados += 1;
      } else {
        console.log("[lembretes] email failed", { to: email, subject, itemId: item.id, error: result.error });
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
