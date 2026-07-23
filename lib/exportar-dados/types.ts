import type { SupabaseClient } from "@supabase/supabase-js";

export type GrupoExportacao =
  | "imoveis"
  | "clientes"
  | "atendimentos"
  | "visitas"
  | "propostas"
  | "negocios"
  | "agenda";

export type ExportTableConfig = {
  table: string;
  select?: string;
  hasCorretorId?: boolean;
  hasPerfilId?: boolean;
};

export type ExportGroupConfig = {
  id: GrupoExportacao;
  label: string;
  description: string;
  tables: ExportTableConfig[];
};

export type ExportScope = {
  corretorId: string;
  usuarioId: string;
  slug: string;
  perfilId: string | null;
  fullAccountAccess: boolean;
};

export type ExportCsvFile = {
  filename: string;
  content: string;
};

export type GeneratedExport = {
  buffer: Buffer;
  filename: string;
  grupos: GrupoExportacao[];
};

export type ExportContext = {
  supabase: SupabaseClient;
  scope: ExportScope;
};
