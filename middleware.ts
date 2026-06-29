import {
  createNextResponseWithSession,
  createRewriteWithSession,
  updateSession,
} from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

function resolveTenantRewriteUrl(request: NextRequest): URL | null {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const url = request.nextUrl.clone();

  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "fxstudio.com.br";
  const appDomain = `app.${mainDomain}`;

  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isVercelApp = hostname.endsWith(".vercel.app");
  const isMainApp =
    isLocalhost ||
    isVercelApp ||
    hostname === appDomain ||
    hostname === mainDomain;

  // 1. CRM panel: main app domains (no tenant rewrite)
  if (isMainApp) {
    return null;
  }

  // 2. FX Studio subdomain (e.g. joao.fxstudio.com.br)
  const isSubdomain =
    hostname.endsWith(`.${mainDomain}`) && !hostname.startsWith("www.");

  if (isSubdomain) {
    const tenant = hostname.replace(`.${mainDomain}`, "");
    url.pathname = `/${tenant}${url.pathname}`;
    return url;
  }

  // 3. Custom domain (corretores.dominio_custom)
  url.pathname = `/site-custom/${hostname}${url.pathname}`;
  return url;
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
