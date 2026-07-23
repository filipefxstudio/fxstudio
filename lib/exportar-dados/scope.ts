import type { EquipeAccessContext } from "@/lib/auth/equipe-access";
import type { ExportScope } from "@/lib/exportar-dados/types";

export function isFullAccountExportAccess(ctx: EquipeAccessContext): boolean {
  if (ctx.isAccountOwner) {
    return true;
  }

  if (!ctx.perfil?.ativo) {
    return false;
  }

  return ctx.perfil.papel === "admin" || ctx.perfil.papel === "gerente";
}

export function buildExportScope(ctx: EquipeAccessContext): ExportScope {
  const fullAccountAccess = isFullAccountExportAccess(ctx);

  return {
    corretorId: ctx.corretor.id,
    usuarioId: ctx.userId,
    slug: ctx.corretor.slug,
    perfilId: fullAccountAccess ? null : (ctx.perfil?.id ?? null),
    fullAccountAccess,
  };
}
