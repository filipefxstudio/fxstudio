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

function sanitizeTelefone(telefone) {
  return telefone.replace(/\D/g, "");
}

function normalizePhoneDigits(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

function telefonesEquivalentesOld(a, b) {
  const digitsA = sanitizeTelefone(a);
  const digitsB = sanitizeTelefone(b);
  if (!digitsA || !digitsB) return false;
  return (
    digitsA === digitsB ||
    digitsA.endsWith(digitsB) ||
    digitsB.endsWith(digitsA)
  );
}

function phonesMatch(a, b) {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length >= 8 && db.length >= 8 && da.slice(-8) === db.slice(-8)) return true;
  if (da.length >= 9 && db.length >= 9 && da.slice(-9) === db.slice(-9)) return true;
  return false;
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SEARCH_PHONE = "(31) 99956-1537";
const telefoneLimpo = sanitizeTelefone(SEARCH_PHONE);

console.log("=== Phone search diagnostic ===");
console.log("Search input:", SEARCH_PHONE);
console.log("Digits:", telefoneLimpo);

// Find Maria by name
const { data: leadsByName } = await supabase
  .from("leads")
  .select("id, nome, telefone, email, cliente_id, corretor_id, codigo_atendimento")
  .ilike("nome", "%Maria Ribeiro%");

console.log("\n--- Leads named Maria Ribeiro ---");
for (const lead of leadsByName ?? []) {
  console.log({
    id: lead.id,
    codigo: lead.codigo_atendimento,
    nome: lead.nome,
    telefone: lead.telefone,
    telefone_digits: sanitizeTelefone(lead.telefone ?? ""),
    corretor_id: lead.corretor_id,
    cliente_id: lead.cliente_id,
    old_match: telefonesEquivalentesOld(lead.telefone ?? "", telefoneLimpo),
    new_match: phonesMatch(lead.telefone ?? "", telefoneLimpo),
    ilike_full: (lead.telefone ?? "").includes(telefoneLimpo),
    ilike_last8: (lead.telefone ?? "").includes(telefoneLimpo.slice(-8)),
  });
}

// Find by ATD-0006
const { data: leadsByCode } = await supabase
  .from("leads")
  .select("id, nome, telefone, email, cliente_id, corretor_id, codigo_atendimento")
  .eq("codigo_atendimento", "ATD-0006");

console.log("\n--- Lead ATD-0006 ---");
console.log(leadsByCode ?? []);

// Simulate current autocomplete SQL filter
const orFiltro = `telefone.ilike.%${telefoneLimpo}%`;
const { data: leadsIlikeFull } = await supabase
  .from("leads")
  .select("id, nome, telefone, codigo_atendimento")
  .or(orFiltro)
  .limit(50);

console.log("\n--- Leads matching ilike full digits (current behavior) ---");
console.log("Filter:", orFiltro);
console.log("Count:", leadsIlikeFull?.length ?? 0);
for (const lead of leadsIlikeFull ?? []) {
  console.log(`  ${lead.codigo_atendimento} | ${lead.nome} | ${lead.telefone}`);
}

const suffix8 = telefoneLimpo.slice(-8);
const orFiltroSuffix = `telefone.ilike.%${suffix8}%`;
const { data: leadsIlikeSuffix } = await supabase
  .from("leads")
  .select("id, nome, telefone, codigo_atendimento")
  .or(orFiltroSuffix)
  .limit(50);

console.log("\n--- Leads matching ilike last 8 digits ---");
console.log("Filter:", orFiltroSuffix);
console.log("Count:", leadsIlikeSuffix?.length ?? 0);
for (const lead of leadsIlikeSuffix ?? []) {
  const match = phonesMatch(lead.telefone ?? "", telefoneLimpo);
  console.log(`  ${lead.codigo_atendimento} | ${lead.nome} | ${lead.telefone} | phonesMatch=${match}`);
}

// Simulate fixed autocomplete (fetch all leads + JS filter)
const mariaCorretorId = leadsByCode?.[0]?.corretor_id;
if (mariaCorretorId) {
  const { data: allLeads } = await supabase
    .from("leads")
    .select("id, nome, telefone, email, cliente_id")
    .eq("corretor_id", mariaCorretorId);

  const filtered = (allLeads ?? []).filter((lead) =>
    phonesMatch(lead.telefone ?? "", telefoneLimpo) ||
    normalizePhoneDigits(lead.telefone ?? "").includes(telefoneLimpo) ||
    telefoneLimpo.includes(normalizePhoneDigits(lead.telefone ?? "")),
  );

  console.log("\n--- Fixed autocomplete simulation (all leads + JS filter) ---");
  console.log("Matches:", filtered.length);
  for (const lead of filtered) {
    console.log(`  ${lead.nome} | ${lead.telefone}`);
  }
}
