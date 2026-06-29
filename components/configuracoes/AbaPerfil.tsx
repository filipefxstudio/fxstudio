"use client";

import { useState, useTransition } from "react";

import { savePerfilCorretor } from "@/lib/actions/corretor-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Corretor } from "@/types";

interface AbaPerfilProps {
  corretor: Corretor;
}

export function AbaPerfil({ corretor }: AbaPerfilProps) {
  const [nome, setNome] = useState(corretor.nome);
  const [telefone, setTelefone] = useState(corretor.telefone ?? "");
  const [creci, setCreci] = useState(corretor.creci ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await savePerfilCorretor({ nome, telefone, creci });

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.message ?? "Perfil salvo.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu perfil</CardTitle>
        <CardDescription>
          Dados básicos exibidos no CRM e no seu site público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creci">CRECI</Label>
            <Input
              id="creci"
              value={creci}
              onChange={(event) => setCreci(event.target.value)}
              placeholder="000000"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {feedback ? (
            <p className="text-sm text-secondary" role="status">
              {feedback}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
