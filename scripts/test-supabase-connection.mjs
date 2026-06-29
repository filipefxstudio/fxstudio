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

function describeKey(name, value) {
  if (!value) {
    return `${name}: missing`;
  }

  const prefix = value.startsWith("sb_publishable_")
    ? "sb_publishable_"
    : value.startsWith("sb_secret_")
      ? "sb_secret_"
      : value.startsWith("eyJ")
        ? "legacy-jwt"
        : "unknown";

  return `${name}: ok (${prefix}, length ${value.length})`;
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

console.log("Supabase connection test");
console.log(url ? `URL: ok (${url})` : "URL: missing");
console.log(describeKey("Publishable key", publishableKey));
console.log(describeKey("Secret key", secretKey));

if (!url || !publishableKey || !secretKey) {
  process.exit(1);
}

const publishableClient = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const secretClient = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const publishableResult = await publishableClient
  .from("corretores")
  .select("id", { count: "exact", head: true });

console.log(
  "Publishable DB access:",
  publishableResult.error
    ? `failed (${publishableResult.error.code}: ${publishableResult.error.message})`
    : "ok",
);

const secretResult = await secretClient
  .from("corretores")
  .select("id", { count: "exact", head: true });

console.log(
  "Secret DB access:",
  secretResult.error
    ? `failed (${secretResult.error.code}: ${secretResult.error.message})`
    : "ok",
);

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: publishableKey },
});

console.log(`Auth health: ${health.status === 200 ? "ok" : `failed (${health.status})`}`);

const signupProbe = await publishableClient.auth.signUp({
  email: `probe-${Date.now()}@example.com`,
  password: "probe-password-123",
});

console.log(
  "SignUp probe:",
  signupProbe.error
    ? `failed (${signupProbe.error.code ?? "unknown"}: ${signupProbe.error.message})`
    : "ok",
);

if (publishableResult.error || secretResult.error || health.status !== 200) {
  process.exit(1);
}
