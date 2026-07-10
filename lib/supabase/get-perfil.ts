import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/types";

export async function getPerfilForUser(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("[getPerfilForUser] failed", error);
    return null;
  }

  return (data as Perfil | null) ?? null;
}
