import { NextResponse } from "next/server";
import { z } from "zod";

import { getEquipeAccessContext } from "@/lib/auth/equipe-access";
import { ALL_EXPORT_GROUPS } from "@/lib/exportar-dados/constants";
import { generateDataExport, registerDataExport } from "@/lib/exportar-dados/generate-export";
import { buildExportScope } from "@/lib/exportar-dados/scope";
import type { GrupoExportacao } from "@/lib/exportar-dados/types";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  grupos: z
    .array(z.enum(ALL_EXPORT_GROUPS as [GrupoExportacao, ...GrupoExportacao[]]))
    .min(1, "Selecione ao menos um grupo de dados."),
});

export async function POST(request: Request) {
  const ctx = await getEquipeAccessContext();

  if (!ctx) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Grupos de exportação inválidos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createClient();
  const scope = buildExportScope(ctx);
  const exportContext = { supabase, scope };

  try {
    const result = await generateDataExport(exportContext, parsed.data.grupos);
    await registerDataExport(exportContext, parsed.data.grupos);

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar exportação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
