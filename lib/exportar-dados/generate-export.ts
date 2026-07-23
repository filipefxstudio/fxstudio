import { getExportGroupConfig } from "@/lib/exportar-dados/constants";
import { rowsToCsv } from "@/lib/exportar-dados/csv";
import { fetchTableRows } from "@/lib/exportar-dados/fetch-data";
import { buildExportFilename, buildExportZip } from "@/lib/exportar-dados/generate-zip";
import { logPostgrestError } from "@/lib/supabase/postgrest-error";
import type {
  ExportContext,
  ExportCsvFile,
  GeneratedExport,
  GrupoExportacao,
} from "@/lib/exportar-dados/types";

async function exportGroupTables(
  ctx: ExportContext,
  grupo: GrupoExportacao,
): Promise<ExportCsvFile[]> {
  const groupConfig = getExportGroupConfig(grupo);
  if (!groupConfig) {
    return [];
  }

  const files: ExportCsvFile[] = [];

  for (const tableConfig of groupConfig.tables) {
    const rows = await fetchTableRows(ctx, tableConfig);
    files.push({
      filename: `${tableConfig.table}.csv`,
      content: rowsToCsv(rows),
    });
  }

  return files;
}

export async function generateDataExport(
  ctx: ExportContext,
  grupos: GrupoExportacao[],
): Promise<GeneratedExport> {
  const csvFiles: ExportCsvFile[] = [];

  for (const grupo of grupos) {
    const groupFiles = await exportGroupTables(ctx, grupo);
    csvFiles.push(...groupFiles);
  }

  const buffer = await buildExportZip(csvFiles);
  const filename = buildExportFilename(ctx.scope.slug);

  return {
    buffer,
    filename,
    grupos,
  };
}

export async function registerDataExport(
  ctx: ExportContext,
  grupos: GrupoExportacao[],
): Promise<void> {
  const { error } = await ctx.supabase.from("exportacoes_dados").insert({
    corretor_id: ctx.scope.corretorId,
    usuario_id: ctx.scope.usuarioId,
    grupos_exportados: grupos,
  });

  if (error) {
    logPostgrestError("registerDataExport", error);
    throw new Error("Exportação gerada, mas falhou ao registrar o histórico.");
  }
}
