import {
  createNextResponseWithSession,
  createRewriteWithSession,
  updateSession,
} from "@/lib/supabase/middleware";
import {
  isReservedAppPath,
  resolveSiteHostContext,
} from "@/lib/site/host";
import { type NextRequest } from "next/server";

function resolveTenantRewriteUrl(request: NextRequest): URL | null {
  const hostname = request.headers.get("host");
  const url = request.nextUrl.clone();
  const ctx = resolveSiteHostContext(hostname);

  // 1. CRM panel: main app domains (no tenant rewrite)
  if (ctx.isMainApp) {
    return null;
  }

  // Never rewrite CRM/auth/api routes on tenant hosts
  if (isReservedAppPath(url.pathname)) {
    return null;
  }

  // 2. FX Studio subdomain (e.g. joao.fxstudio.com.br)
  if (ctx.isSubdomain && ctx.tenantFromSubdomain) {
    url.pathname = `/${ctx.tenantFromSubdomain}${url.pathname}`;
    return url;
  }

  // 3. Custom domain (corretores.dominio_custom)
  if (ctx.isCustomDomain) {
    url.pathname = `/site-custom/${ctx.hostname}${url.pathname}`;
    return url;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const session = await updateSession(request);
  const rewriteUrl = resolveTenantRewriteUrl(request);

  if (!rewriteUrl) {
    return createNextResponseWithSession(request, session);
  }

  return createRewriteWithSession(session, rewriteUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
