"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  restoreDefaultFichaVisita,
  saveConfigFichaVisita,
} from "@/lib/actions/ficha-visita";
import {
  DEFAULT_FICHA_VISITA_CLAUSULA,
  DEFAULT_PERCENTUAL_COMISSAO,
} from "@/lib/ficha-visita/constants";
import { formatPercentual } from "@/lib/ficha-visita/utils";
import type { ConfigFichaVisita } from "@/types";

interface AbaFichaVisitaProps {
  initialConfig: ConfigFichaVisita | null;
}

function getInitialClausula(config: ConfigFichaVisita | null): string {
  if (!config || config.usa_texto_padrao) {
    return DEFAULT_FICHA_VISITA_CLAUSULA;
  }
  return config.texto_clausula?.trim() || DEFAULT_FICHA_VISITA_CLAUSULA;
}

export function AbaFichaVisita({ initialConfig }: AbaFichaVisitaProps) {
  const [clausula, setClausula] = useState(getInitialClausula(initialConfig));
  const [percentual, setPercentual] = useState(
    initialConfig?.percentual_comissao ?? DEFAULT_PERCENTUAL_COMISSAO,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveConfigFichaVisita({
        texto_clausula: clausula,
        percentual_comissao: percentual,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.message ?? "Alterações salvas.");
    });
  }

  function handleRestore() {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await restoreDefaultFichaVisita();
      if (result.error) {
        setError(result.error);
        return;
      }
      setClausula(DEFAULT_FICHA_VISITA_CLAUSULA);
      setPercentual(DEFAULT_PERCENTUAL_COMISSAO);
      setFeedback(result.message ?? "Ficha padrão restaurada.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha de visita</CardTitle>
        <CardDescription>
          Texto da cláusula e percentual de comissão usados ao gerar a ficha final no CRM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ficha-clausula">Texto da cláusula</Label>
            <Textarea
              id="ficha-clausula"
              rows={12}
              value={clausula}
              onChange={(e) => setClausula(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {"{{imobiliaria}}"}, {"{{percentual}}"}, {"{{corretor}}"}
            </p>
          </div>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="ficha-percentual">Percentual de comissão (%)</Label>
            <Input
              id="ficha-percentual"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={percentual}
              onChange={(e) => setPercentual(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Valor atual no texto padrão: {formatPercentual(percentual)}%
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {feedback ? <p className="text-sm text-secondary">{feedback}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={handleRestore}>
              Restaurar ficha padrão
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
