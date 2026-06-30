"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DIAS_ALERTA_INATIVIDADE,
  STORAGE_KEY_DIAS_ALERTA_INATIVIDADE,
} from "@/lib/constants/config";

export function AbaFunil() {
  const [dias, setDias] = useState(DEFAULT_DIAS_ALERTA_INATIVIDADE);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DIAS_ALERTA_INATIVIDADE);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setDias(parsed);
      }
    }
  }, []);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    startTransition(() => {
      localStorage.setItem(STORAGE_KEY_DIAS_ALERTA_INATIVIDADE, String(dias));
      setFeedback("Configuração salva no navegador.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de vendas</CardTitle>
        <CardDescription>
          Configure alertas de inatividade e prepare seu funil comercial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSave} className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dias-alerta">Dias para alerta de inatividade</Label>
            <Input
              id="dias-alerta"
              type="number"
              min={1}
              max={90}
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: {DEFAULT_DIAS_ALERTA_INATIVIDADE} dias. Usado no dashboard e filtros de
              leads. Salvo em localStorage neste navegador (sem coluna dedicada em corretores na
              Etapa 3).
            </p>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
          {feedback ? <p className="text-sm text-[#2DC653]">{feedback}</p> : null}
        </form>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Em breve você poderá personalizar as etapas do funil, renomear colunas do kanban e
          definir regras automáticas de avanço entre etapas.
        </div>
      </CardContent>
    </Card>
  );
}
