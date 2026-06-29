import type { FinalidadeImovel, TipoImovel } from "@/types";

import type { ImoveisPublicosFilters } from "@/lib/site/queries";

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const TIPOS: TipoImovel[] = [
  "apartamento",
  "casa",
  "terreno",
  "comercial",
  "cobertura",
  "studio",
];

const FINALIDADES: FinalidadeImovel[] = ["venda", "locacao"];

function parseTipo(value: string | undefined): TipoImovel | undefined {
  if (!value) {
    return undefined;
  }
  return TIPOS.includes(value as TipoImovel) ? (value as TipoImovel) : undefined;
}

function parseFinalidade(value: string | undefined): FinalidadeImovel | undefined {
  if (!value) {
    return undefined;
  }
  return FINALIDADES.includes(value as FinalidadeImovel)
    ? (value as FinalidadeImovel)
    : undefined;
}

export function parseImoveisSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ImoveisPublicosFilters {
  return {
    tipo: parseTipo(getParam(searchParams, "tipo")),
    finalidade: parseFinalidade(getParam(searchParams, "finalidade")),
    bairro: getParam(searchParams, "bairro"),
    valorMin: parseNumber(getParam(searchParams, "valorMin")),
    valorMax: parseNumber(getParam(searchParams, "valorMax")),
  };
}

export async function resolveSiteBasePath(options: {
  tenantSlug: string;
  routeKind: "slug" | "custom";
  hostname?: string;
}): Promise<string> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "fxstudio.com.br";
  const appDomain = `app.${mainDomain}`;

  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isSubdomain =
    host.endsWith(`.${mainDomain}`) && !host.startsWith("www.") && host !== mainDomain;
  const isCustomDomainProduction =
    !isLocalhost && host !== appDomain && host !== mainDomain && !isSubdomain;

  if (options.routeKind === "custom") {
    if (isCustomDomainProduction) {
      return "";
    }

    return `/site-custom/${options.hostname ?? host.split(":")[0]}`;
  }

  if (isSubdomain || isCustomDomainProduction) {
    return "";
  }

  return `/${options.tenantSlug}`;
}

export function sitePath(basePath: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!basePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return basePath;
  }

  return `${basePath}${normalizedPath}`;
}
