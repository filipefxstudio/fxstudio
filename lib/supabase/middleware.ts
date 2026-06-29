import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type SessionUpdateResult = {
  cookiesToSet: CookieToSet[];
  authHeaders: Record<string, string>;
};

function applySessionToResponse(
  response: NextResponse,
  { cookiesToSet, authHeaders }: SessionUpdateResult,
): NextResponse {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  Object.entries(authHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export async function updateSession(
  request: NextRequest,
): Promise<SessionUpdateResult> {
  let cookiesToSet: CookieToSet[] = [];
  let authHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies, headers) {
          cookiesToSet = cookies;
          authHeaders = headers;
          cookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and supabase.auth.getUser().
  await supabase.auth.getUser();

  return { cookiesToSet, authHeaders };
}

export function createNextResponseWithSession(
  request: NextRequest,
  session: SessionUpdateResult,
): NextResponse {
  return applySessionToResponse(NextResponse.next({ request }), session);
}

export function createRewriteWithSession(
  session: SessionUpdateResult,
  url: URL,
): NextResponse {
  return applySessionToResponse(NextResponse.rewrite(url), session);
}
