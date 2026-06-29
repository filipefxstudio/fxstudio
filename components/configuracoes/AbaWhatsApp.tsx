"use client";

import { useState, useTransition } from "react";

import { saveWhatsAppConfig } from "@/lib/actions/corretor-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Corretor } from "@/types";

interface AbaWhatsAppProps {
  corretor: Corretor;
}

export function AbaWhatsApp({ corretor }: AbaWhatsAppProps) {
  const [zapiInstanceId, setZapiInstanceId] = useState(corretor.zapi_instance_id ?? "");
  const [zapiToken, setZapiToken] = useState(corretor.zapi_token ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveWhatsAppConfig({
        zapi_instance_id: zapiInstanceId,
        zapi_token: zapiToken,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.message ?? "WhatsApp salvo.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>
          Conecte sua instância Z-API para receber mensagens e acionar o agente de IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zapi_instance_id">ID da instância Z-API</Label>
            <Input
              id="zapi_instance_id"
              value={zapiInstanceId}
              onChange={(event) => setZapiInstanceId(event.target.value)}
              placeholder="Ex.: 3B2C1D4E5F6G7H8I9J0K"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zapi_token">Token Z-API</Label>
            <Input
              id="zapi_token"
              type="password"
              value={zapiToken}
              onChange={(event) => setZapiToken(event.target.value)}
              placeholder="Seu token de integração"
              autoComplete="off"
            />
          </div>

          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Configure o webhook da Z-API apontando para{" "}
            <code className="rounded bg-background px-1 py-0.5 text-foreground">
              /api/webhook/zapi
            </code>
          </p>

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
            {isPending ? "Salvando..." : "Salvar WhatsApp"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
