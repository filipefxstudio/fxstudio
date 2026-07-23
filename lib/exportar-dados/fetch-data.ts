import { logPostgrestError } from "@/lib/supabase/postgrest-error";
import type { ExportContext, ExportTableConfig } from "@/lib/exportar-dados/types";

const PAGE_SIZE = 1000;

type GenericRow = Record<string, unknown>;

export async function fetchTableRows(
  ctx: ExportContext,
  config: ExportTableConfig,
): Promise<GenericRow[]> {
  const rows: GenericRow[] = [];
  let from = 0;

  while (true) {
    let query = ctx.supabase
      .from(config.table)
      .select(config.select ?? "*")
      .range(from, from + PAGE_SIZE - 1);

    if (config.hasCorretorId) {
      query = query.eq("corretor_id", ctx.scope.corretorId);
    }

    if (config.hasPerfilId && !ctx.scope.fullAccountAccess && ctx.scope.perfilId) {
      query = query.eq("perfil_id", ctx.scope.perfilId);
    }

    const { data, error } = await query;

    if (error) {
      logPostgrestError(`exportar-dados:${config.table}`, error);
      throw new Error(`Falha ao exportar a tabela ${config.table}.`);
    }

    const page = ((data as unknown) as GenericRow[] | null) ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}
