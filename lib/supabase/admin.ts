import { createClient } from "@supabase/supabase-js";

function resolveServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    ""
  );
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = resolveServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
