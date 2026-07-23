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

const extendedColumns = [
  "valor_recursos_proprios",
  "valor_financiado",
  "valor_fgts",
  "rateio",
];

console.log("Negocios schema probe");

let migrationApplied = true;

for (const column of extendedColumns) {
  const result = await client.from("negocios").select(column).limit(1);
  const ok = !result.error;
  migrationApplied &&= ok;
  console.log(
    column + ":",
    ok ? "ok" : `missing (${result.error?.code}: ${result.error?.message})`,
  );
}

if (!migrationApplied) {
  console.log("\nMigration pendente: supabase/migrations/20260718200000_negocios_completo.sql");
  console.log("Execute no Supabase SQL Editor para habilitar rateio e financiamento estruturados.");
}

const { data: lead } = await client
  .from("leads")
  .select("id, corretor_id")
  .limit(1)
  .maybeSingle();

const { data: imovel } = await client
  .from("imoveis")
  .select("id")
  .eq("corretor_id", lead?.corretor_id ?? "00000000-0000-0000-0000-000000000000")
  .limit(1)
  .maybeSingle();

const { data: perfil } = await client
  .from("perfis")
  .select("id")
  .eq("corretor_id", lead?.corretor_id ?? "00000000-0000-0000-0000-000000000000")
  .limit(1)
  .maybeSingle();

if (!lead || !imovel) {
  console.log("Sem lead/imóvel para probe de insert.");
  process.exit(migrationApplied ? 0 : 1);
}

const basePayload = {
  corretor_id: lead.corretor_id,
  lead_id: lead.id,
  imovel_id: imovel.id,
  perfil_id: perfil?.id ?? null,
  valor_fechamento: 500000,
  valor_comissao: 15000,
  percentual_comissao: 3,
  data_fechamento: "2026-07-18",
  forma_pagamento: "avista",
  status: "fechado",
};

const extendedPayload = {
  ...basePayload,
  rateio: perfil
    ? [{ perfil_id: perfil.id, papel: "vendedor", percentual: 100, valor: 15000 }]
    : [],
};

const payload = migrationApplied ? extendedPayload : basePayload;

const { data, error } = await client
  .from("negocios")
  .insert(payload)
  .select("id")
  .single();

if (error) {
  console.error("[insert probe]", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  process.exit(1);
}

console.log("Insert ok, id:", data.id);
await client.from("negocios").delete().eq("id", data.id);
console.log("Cleanup done");
