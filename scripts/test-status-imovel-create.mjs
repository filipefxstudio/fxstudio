/**
 * Diagnóstico: simula lookup de status "Em cadastro" no fluxo createImovel.
 * Uso: node scripts/test-status-imovel-create.mjs [corretor_id]
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
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !secretKey || !publishableKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STATUS_NOME = "Em cadastro";
const DEFAULT_STATUS = [
  { nome: "Em cadastro", cor: "#94A3B8", padrao: false, ativo: true, ordem: -2 },
  { nome: "Aguardando aprovação", cor: "#F59E0B", padrao: false, ativo: true, ordem: -1 },
  { nome: "Disponível", cor: "#2DC653", padrao: true, ativo: true, ordem: 1 },
  { nome: "Reservado", cor: "#F18F01", padrao: true, ativo: true, ordem: 2 },
  { nome: "Vendido", cor: "#1E3A5F", padrao: true, ativo: true, ordem: 3 },
  { nome: "Locado", cor: "#7C3AED", padrao: true, ativo: true, ordem: 4 },
  { nome: "Desativado", cor: "#6B7280", padrao: false, ativo: true, ordem: 99 },
];

async function seedStatusForCorretor(corretorId) {
  const { data: existing } = await admin
    .from("status_imovel")
    .select("nome")
    .eq("corretor_id", corretorId);

  const existingNames = new Set((existing ?? []).map((r) => r.nome));
  const rows = DEFAULT_STATUS.filter((s) => !existingNames.has(s.nome)).map((s) => ({
    corretor_id: corretorId,
    ...s,
  }));

  for (const row of rows) {
    const { error } = await admin.from("status_imovel").insert(row);
    if (error && error.code !== "23505") {
      throw new Error(`Insert failed: ${error.message} (${error.code})`);
    }
  }
}

async function lookupStatusAsUser(userId, corretorId) {
  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError || !authData?.user) {
    return { error: `auth lookup failed: ${authError?.message}` };
  }

  const email = authData.user.email;
  if (!email) {
    return { error: "user has no email" };
  }

  const password = process.env.TEST_USER_PASSWORD;
  if (!password) {
    return { skipped: true, reason: "Set TEST_USER_PASSWORD in .env.local to test RLS as user" };
  }

  const { error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: `signIn failed: ${signInError.message}` };
  }

  const { data, error } = await anon
    .from("status_imovel")
    .select("*")
    .eq("corretor_id", corretorId)
    .eq("nome", STATUS_NOME)
    .maybeSingle();

  return { data, error: error ? `${error.code}: ${error.message}` : null };
}

async function diagnoseCorretor(corretor) {
  console.log("\n--- Corretor ---");
  console.log(`id: ${corretor.id}`);
  console.log(`nome: ${corretor.nome}`);
  console.log(`email: ${corretor.email}`);
  console.log(`user_id: ${corretor.user_id}`);
  console.log(`criado_em: ${corretor.criado_em ?? "n/a"}`);

  const { data: statuses, error: listError } = await admin
    .from("status_imovel")
    .select("id, nome, ativo, ordem")
    .eq("corretor_id", corretor.id)
    .order("ordem");

  if (listError) {
    console.log(`status list error: ${listError.message}`);
    return;
  }

  console.log(`status count (admin): ${statuses?.length ?? 0}`);
  const emCadastro = statuses?.find((s) => s.nome === STATUS_NOME);
  console.log(`"Em cadastro" via admin: ${emCadastro ? emCadastro.id : "NOT FOUND"}`);

  const similar = statuses?.filter((s) =>
    s.nome.toLowerCase().includes("cadastro"),
  );
  if (similar?.length && !emCadastro) {
    console.log("Similar names:", similar.map((s) => JSON.stringify(s.nome)).join(", "));
  }

  const { data: corretorAsUser } = await admin
    .from("corretores")
    .select("id")
    .eq("user_id", corretor.user_id)
    .maybeSingle();
  console.log(`getCorretorForUser match: ${corretorAsUser?.id === corretor.id ? "OK" : "MISMATCH"}`);

  if (!emCadastro) {
    console.log("Attempting seed...");
    try {
      await seedStatusForCorretor(corretor.id);
      const { data: after } = await admin
        .from("status_imovel")
        .select("id, nome")
        .eq("corretor_id", corretor.id)
        .eq("nome", STATUS_NOME)
        .maybeSingle();
      console.log(`After seed: ${after ? after.id : "STILL NOT FOUND"}`);
    } catch (e) {
      console.log(`Seed failed: ${e.message}`);
    }
  }

  if (corretor.user_id) {
    const rlsResult = await lookupStatusAsUser(corretor.user_id, corretor.id);
    console.log("RLS lookup as user:", JSON.stringify(rlsResult, null, 2));
  }
}

const targetId = process.argv[2];

if (targetId) {
  const { data: corretor, error } = await admin
    .from("corretores")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !corretor) {
    console.error("Corretor not found:", error?.message);
    process.exit(1);
  }
  await diagnoseCorretor(corretor);
} else {
  const { data: corretores, error } = await admin
    .from("corretores")
    .select("id, nome, email, user_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Checking ${corretores.length} most recent corretores...`);

  for (const c of corretores) {
    const full = await admin.from("corretores").select("*").eq("id", c.id).single();
    await diagnoseCorretor(full.data);
  }

  const { data: allCorretores } = await admin.from("corretores").select("id");
  let missingCount = 0;
  for (const c of allCorretores ?? []) {
    const { data: st } = await admin
      .from("status_imovel")
      .select("id")
      .eq("corretor_id", c.id)
      .eq("nome", STATUS_NOME)
      .maybeSingle();
    if (!st) missingCount += 1;
  }
  console.log(`\n=== Summary: ${missingCount}/${allCorretores?.length ?? 0} corretores missing "${STATUS_NOME}" ===`);
}
