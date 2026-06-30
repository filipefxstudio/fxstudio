"use client";

import { Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { addTipoImovelCustom, toggleTipoImovelCustom } from "@/lib/actions/configuracoes";
import type { TipoImovelCustom } from "@/types";

interface AbaTiposImovelProps {
  tipos: TipoImovelCustom[];
}

export function AbaTiposImovel({ tipos: initialTipos }: AbaTiposImovelProps) {
  const [tipos, setTipos] = useState(initialTipos);
  const [novoTipo, setNovoTipo] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await addTipoImovelCustom(novoTipo);

      if (result.error) {
        setError(result.error);
        return;
      }

      setTipos((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          corretor_id: "",
          nome: novoTipo.trim(),
          ativo: true,
        },
      ]);
      setNovoTipo("");
      setFeedback(result.message ?? "Tipo adicionado.");
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      const result = await toggleTipoImovelCustom(id, ativo);

      if (result.error) {
        setError(result.error);
        return;
      }

      setTipos((prev) =>
        prev.map((tipo) => (tipo.id === id ? { ...tipo, ativo } : tipo)),
      );
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de imóvel</CardTitle>
        <CardDescription>
          Tipos disponíveis no cadastro de imóveis. Desative os que não utiliza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y rounded-lg border">
          {tipos.map((tipo) => (
            <li
              key={tipo.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className={tipo.ativo ? "" : "text-muted-foreground line-through"}>
                {tipo.nome}
              </span>
              <Switch
                checked={tipo.ativo}
                onCheckedChange={(checked) => handleToggle(tipo.id, checked)}
                disabled={isPending}
                aria-label={`Ativar ${tipo.nome}`}
              />
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Novo tipo de imóvel"
            value={novoTipo}
            onChange={(event) => setNovoTipo(event.target.value)}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !novoTipo.trim()}>
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
