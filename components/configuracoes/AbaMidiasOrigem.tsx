"use client";

import { ArrowDown, ArrowUp, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  addMidiaOrigem,
  reorderMidiasOrigem,
  toggleMidiaOrigem,
} from "@/lib/actions/configuracoes";
import type { MidiaOrigem } from "@/types";

interface AbaMidiasOrigemProps {
  midias: MidiaOrigem[];
}

export function AbaMidiasOrigem({ midias: initialMidias }: AbaMidiasOrigemProps) {
  const [midias, setMidias] = useState(initialMidias);
  const [novaMidia, setNovaMidia] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await addMidiaOrigem(novaMidia);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMidias((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          corretor_id: "",
          nome: novaMidia.trim(),
          ativo: true,
          ordem: prev.length,
        },
      ]);
      setNovaMidia("");
      setFeedback(result.message ?? "Mídia adicionada.");
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      const result = await toggleMidiaOrigem(id, ativo);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMidias((prev) =>
        prev.map((midia) => (midia.id === id ? { ...midia, ativo } : midia)),
      );
    });
  }

  function moveMidia(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= midias.length) {
      return;
    }

    const reordered = [...midias];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;

    setMidias(reordered);

    startTransition(async () => {
      await reorderMidiasOrigem(reordered.map((m) => m.id));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mídias de origem</CardTitle>
        <CardDescription>
          Canais de onde os leads podem vir. Reordene conforme sua prioridade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y rounded-lg border">
          {midias.map((midia, index) => (
            <li
              key={midia.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === 0 || isPending}
                    onClick={() => moveMidia(index, "up")}
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === midias.length - 1 || isPending}
                    onClick={() => moveMidia(index, "down")}
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>
                <span className={midia.ativo ? "" : "text-muted-foreground line-through"}>
                  {midia.nome}
                </span>
              </div>
              <Switch
                checked={midia.ativo}
                onCheckedChange={(checked) => handleToggle(midia.id, checked)}
                disabled={isPending}
              />
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nova mídia de origem"
            value={novaMidia}
            onChange={(event) => setNovaMidia(event.target.value)}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !novaMidia.trim()}>
            {isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Plus className="size-4" data-icon="inline-start" />
            )}
            Adicionar
          </Button>
        </form>

        {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
