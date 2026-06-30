import type { FinalidadeImovel, TipoImovel } from "@/types";

import type { ImoveisPublicosFilters } from "@/lib/site/queries";
import { resolveSiteHostContext } from "@/lib/site/host";

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
  const ctx = resolveSiteHostContext(host);

  if (options.routeKind === "custom") {
    if (ctx.isCustomDomain) {
      return "";
    }

    return `/site-custom/${options.hostname ?? ctx.hostname}`;
  }

  if (ctx.isSubdomain || ctx.isCustomDomain) {
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
