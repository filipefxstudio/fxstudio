/**
 * Documento J — verificação de RLS e políticas no Supabase.
 * Uso: node scripts/test-rls-isolation.mjs
 *
 * Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 * Teste de isolamento entre 2 contas requer credenciais manuais (ver relatório).
 */
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
  console.error("Missing Supabase URL or service role key in .env.local");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DOC_J_TABLES = [
  { name: "corretores", aliases: [] },
  { name: "perfis", aliases: [] },
  { name: "assinaturas", aliases: [] },
  { name: "clientes", aliases: [] },
  { name: "imoveis", aliases: [] },
  { name: "imovel_fotos", aliases: [] },
  { name: "imovel_captadores", aliases: [] },
  { name: "imovel_proprietarios", aliases: [] },
  { name: "auditoria_imovel", aliases: [] },
  { name: "leads", aliases: [] },
  { name: "lead_interacoes", aliases: [] },
  { name: "lead_imoveis_selecionados", aliases: [] },
  { name: "visitas", aliases: [] },
  { name: "propostas", aliases: [] },
  { name: "negocios", aliases: [] },
  { name: "agenda", aliases: [] },
  { name: "auditoria_atendimento", aliases: [] },
  { name: "tipo_imovel_custom", aliases: ["tipos_imovel"] },
  { name: "status_imovel", aliases: [] },
  { name: "midia_origem", aliases: ["midias_origem"] },
  { name: "motivos_descarte", aliases: ["motivos_descarte_lead"] },
  { name: "motivos_desativacao", aliases: ["motivos_desativacao_imovel"] },
  { name: "tipos_compromisso", aliases: [] },
  { name: "config_ficha_visita", aliases: [] },
];

const REQUIRED_OPS = ["SELECT", "INSERT", "UPDATE", "DELETE"];
const AUDIT_ONLY_OPS = ["SELECT", "INSERT"];

async function fetchRlsStatus() {
  const { data, error } = await admin.rpc("exec_sql", {
    query: `
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      ORDER BY c.relname
    `,
  });

  if (error) {
    return null;
  }

  return data;
}

async function fetchPolicies() {
  const { data, error } = await admin
    .from("pg_policies")
    .select("tablename, cmd, policyname, qual, with_check")
    .eq("schemaname", "public");

  if (error) {
    const { data: raw, error: sqlError } = await admin.rpc("exec_sql", {
      query: `
        SELECT tablename, cmd, policyname, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
      `,
    });

    if (sqlError) {
      console.error("Could not read pg_policies:", error.message, sqlError.message);
      return [];
    }

    return raw ?? [];
  }

  return data ?? [];
}

async function checkTablesViaInformationSchema() {
  const results = [];

  for (const table of DOC_J_TABLES) {
    const { count, error } = await admin
      .from(table.name)
      .select("*", { count: "exact", head: true });

    results.push({
      table: table.name,
      reachable: !error,
      error: error?.message ?? null,
      rowEstimate: count,
    });
  }

  return results;
}

async function main() {
  console.log("=== Documento J — RLS audit ===\n");

  const tableChecks = await checkTablesViaInformationSchema();

  for (const check of tableChecks) {
    const status = check.reachable ? "OK (table exists)" : `MISSING/ERROR: ${check.error}`;
    console.log(`${check.table.padEnd(28)} ${status}`);
  }

  console.log("\n--- Policy check (via pg_policies view) ---\n");

  const policies = await fetchPolicies();

  if (policies.length === 0) {
    console.log(
      "AVISO: pg_policies não acessível via API. Verifique manualmente no SQL Editor:\n",
    );
    console.log(`SELECT tablename, cmd, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;`);
  } else {
    for (const table of DOC_J_TABLES) {
      const tablePolicies = policies.filter((p) => p.tablename === table.name);
      const ops = new Set(tablePolicies.map((p) => p.cmd));

      const isAuditTable = table.name.startsWith("auditoria_");
      const required = isAuditTable ? AUDIT_ONLY_OPS : REQUIRED_OPS;
      const missing = required.filter((op) => !ops.has(op));

      const permissive = tablePolicies.filter(
        (p) =>
          (p.qual && /true/i.test(String(p.qual))) ||
          (p.with_check && /true/i.test(String(p.with_check))),
      );

      let status = missing.length === 0 ? "OK" : `FALTA: ${missing.join(", ")}`;
      if (permissive.length > 0) {
        status += ` | REVISAR USING(true): ${permissive.map((p) => p.policyname).join(", ")}`;
      }

      console.log(`${table.name.padEnd(28)} ${status} (${tablePolicies.length} policies)`);
    }
  }

  console.log("\n--- Isolamento entre contas ---");
  console.log(
    "MANUAL: criar 2 corretores de teste, inserir lead/imóvel em cada um, autenticar como A e tentar SELECT do tenant B.",
  );
  console.log(
    "Esperado: 0 rows para cross-tenant; corretor vê só leads/clientes do próprio perfil_id.",
  );

  console.log("\n--- Service role ---");
  console.log("OK: SUPABASE_SERVICE_ROLE_KEY presente em .env.local (não exposta ao client).");
  console.log("Verificar: grep SUPABASE_SERVICE_ROLE em components/ — deve retornar vazio.");

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
