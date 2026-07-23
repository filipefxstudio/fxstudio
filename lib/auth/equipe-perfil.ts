import type { Corretor, Perfil } from "@/types";

export type CorretorRef = Pick<Corretor, "user_id" | "email">;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Dono da conta: único perfil ativo cujo user_id e e-mail coincidem com o corretor. */
export function isPrincipalPerfil(perfil: Perfil, corretor: CorretorRef): boolean {
  return (
    perfil.ativo &&
    perfil.user_id === corretor.user_id &&
    normalizeEmail(perfil.email) === normalizeEmail(corretor.email)
  );
}

/** Perfil convidado ainda sem acesso ativo (inclui placeholder legado com user_id do dono). */
export function isPerfilConvitePendente(perfil: Perfil, corretor: CorretorRef): boolean {
  return !perfil.ativo && !isPrincipalPerfil(perfil, corretor);
}

/** Admin ativo no tenant: papel admin ou dono da conta (principal) ativo. */
export function isActiveAdminPerfil(
  perfil: Pick<Perfil, "ativo" | "papel" | "user_id" | "email">,
  corretor: CorretorRef,
): boolean {
  if (!perfil.ativo) return false;
  if (perfil.papel === "admin") return true;
  return isPrincipalPerfil(perfil as Perfil, corretor);
}

/** Perfil com conta auth vinculada (pode atualizar auth.users.email). */
export function perfilTemAuthVinculado(perfil: Perfil, corretor: CorretorRef): boolean {
  if (isPrincipalPerfil(perfil, corretor)) return true;
  if (isPerfilConvitePendente(perfil, corretor)) return false;
  return perfil.user_id !== corretor.user_id;
}

function perfilEquipeRank(perfil: Perfil, corretorUserId: string): number {
  let score = 0;
  if (perfil.ativo) score += 100;
  if (perfil.user_id !== corretorUserId) score += 50;
  if (perfil.papel === "admin") score += 10;
  return score;
}

/** Remove duplicatas por e-mail (ex.: convite pendente + conta ativada). */
export function dedupePerfisEquipe(perfis: Perfil[], corretorUserId: string): Perfil[] {
  const byEmail = new Map<string, Perfil>();

  for (const perfil of perfis) {
    const key = perfil.email.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (!existing || perfilEquipeRank(perfil, corretorUserId) > perfilEquipeRank(existing, corretorUserId)) {
      byEmail.set(key, perfil);
    }
  }

  return Array.from(byEmail.values()).sort(
    (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
  );
}
