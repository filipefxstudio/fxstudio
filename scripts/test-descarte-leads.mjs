import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);

    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing Supabase URL or secret key in .env.local");
  process.exit(1);
}

const client = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const columns = ["motivo_descarte_id", "motivo_descarte_texto", "situacao"];

console.log("Descarte leads schema probe");

for (const column of columns) {
  const result = await client.from("leads").select(column).limit(1);
  console.log(
    column + ":",
    result.error
      ? `failed (${result.error.code}: ${result.error.message})`
      : "ok",
  );
}

const { data: lead } = await client
  .from("leads")
  .select("id, corretor_id, situacao, etapa")
  .limit(1)
  .maybeSingle();

const { data: motivo } = await client
  .from("motivos_descarte")
  .select("id, corretor_id, nome")
  .limit(1)
  .maybeSingle();

console.log("sample lead:", lead ?? "none");
console.log("sample motivo:", motivo ?? "none");

if (lead && motivo) {
  const agora = new Date().toISOString();
  const { data, error } = await client
    .from("leads")
    .update({
      situacao: "descartado",
      etapa: "perdido",
      motivo_descarte_id: motivo.id,
      motivo_descarte_texto: "probe descarte",
      atualizado_em: agora,
    })
    .eq("id", lead.id)
    .select("id, situacao, etapa, motivo_descarte_id")
    .maybeSingle();

  console.log(
    "update probe:",
    error ? `failed (${error.code}: ${error.message})` : data,
  );

  if (!error && data) {
    await client
      .from("leads")
      .update({
        situacao: lead.situacao,
        etapa: lead.etapa,
        motivo_descarte_id: null,
        motivo_descarte_texto: null,
        atualizado_em: agora,
      })
      .eq("id", lead.id);
    console.log("reverted probe update");
  }
}
