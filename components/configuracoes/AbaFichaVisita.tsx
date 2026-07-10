"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveAtendimentoConfig } from "@/lib/actions/atendimentos";
import { DEFAULT_FICHA_VISITA_TEXTO } from "@/lib/constants/atendimentos";
import type { AtendimentoConfig } from "@/types";

interface AbaFichaVisitaProps {
  initialConfig: AtendimentoConfig | null;
}

export function AbaFichaVisita({ initialConfig }: AbaFichaVisitaProps) {
  const [fichaTexto, setFichaTexto] = useState(
    initialConfig?.ficha_visita_texto ?? DEFAULT_FICHA_VISITA_TEXTO,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveAtendimentoConfig({ ficha_visita_texto: fichaTexto });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.message ?? "Ficha salva.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha de visita</CardTitle>
        <CardDescription>Template usado ao gerar fichas de visita no CRM.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ficha">Texto da ficha</Label>
            <Textarea
              id="ficha"
              rows={10}
              value={fichaTexto}
              onChange={(e) => setFichaTexto(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {"{{nome_corretor}}"}, {"{{nome_lead}}"}, {"{{cidade_imovel}}"},
              {" {{dia}}"}, {"{{mes}}"}, {"{{ano}}"}, {"{{imoveis_lista}}"}, {"{{observacoes}}"}
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {feedback ? <p className="text-sm text-secondary">{feedback}</p> : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar ficha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
