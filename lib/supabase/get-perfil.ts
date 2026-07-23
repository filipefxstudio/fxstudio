import { createClient } from "@/lib/supabase/server";
import { logPostgrestError } from "@/lib/supabase/postgrest-error";
import type { Perfil } from "@/types";

function perfilPriorityScore(perfil: Perfil): number {
  let score = 0;
  if (perfil.ativo) score += 100;
  if (perfil.papel === "admin") score += 10;
  return score;
}

function pickBestPerfil(perfis: Perfil[]): Perfil | null {
  if (perfis.length === 0) {
    return null;
  }

  return [...perfis].sort((a, b) => {
    const scoreDiff = perfilPriorityScore(b) - perfilPriorityScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
  })[0];
}

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
    .eq("user_id", user.id);

  if (error) {
    logPostgrestError("getPerfilForUser", error);
    return null;
  }

  const perfis = (data as Perfil[] | null) ?? [];

  if (perfis.length > 1) {
    console.warn(
      `[getPerfilForUser] ${perfis.length} perfis for user ${user.id}, picking best`,
    );
  }

  return pickBestPerfil(perfis);
}
