"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_EXPORT_GROUPS, EXPORT_GROUPS } from "@/lib/exportar-dados/constants";
import type { GrupoExportacao } from "@/lib/exportar-dados/types";

function parseDownloadFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? null;
}

export function AbaExportarDados() {
  const [selectedGroups, setSelectedGroups] = useState<Set<GrupoExportacao>>(
    () => new Set(ALL_EXPORT_GROUPS),
  );
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleGroup(group: GrupoExportacao, checked: boolean) {
    setSelectedGroups((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(group);
      } else {
        next.delete(group);
      }
      return next;
    });
  }

  function handleExport() {
    setError(null);
    setFeedback(null);

    const grupos = ALL_EXPORT_GROUPS.filter((group) => selectedGroups.has(group));
    if (grupos.length === 0) {
      setError("Selecione ao menos um grupo de dados para exportar.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/exportar-dados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grupos }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "Não foi possível gerar a exportação.");
          return;
        }

        const blob = await response.blob();
        const filename =
          parseDownloadFilename(response.headers.get("Content-Disposition")) ??
          "fxstudio-export.zip";

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        setFeedback("Exportação gerada com sucesso. O download deve iniciar em instantes.");
      } catch {
        setError("Erro de conexão ao gerar a exportação.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar meus dados</CardTitle>
        <CardDescription>
          Baixe uma cópia dos seus dados cadastrados no sistema, incluindo imóveis, clientes,
          atendimentos e negócios. Os arquivos são gerados em CSV dentro de um ZIP, filtrados
          apenas para a sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Grupos de dados</p>
          <div className="grid gap-3">
            {EXPORT_GROUPS.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={selectedGroups.has(group.id)}
                  disabled={isPending}
                  onCheckedChange={(checked) => toggleGroup(group.id, checked === true)}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">{group.label}</span>
                  <span className="block text-sm text-muted-foreground">{group.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

        <Button type="button" onClick={handleExport} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Gerando exportação...
            </>
          ) : (
            <>
              <Download className="size-4" />
              Gerar exportação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
