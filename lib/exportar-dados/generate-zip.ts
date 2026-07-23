import JSZip from "jszip";

import type { ExportCsvFile } from "@/lib/exportar-dados/types";

export async function buildExportZip(files: ExportCsvFile[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.content);
  }

  const arrayBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return Buffer.from(arrayBuffer);
}

export function buildExportFilename(slug: string, date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "conta";
  return `fxstudio-export-${safeSlug}-${isoDate}.zip`;
}
