"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";

import { saveSiteConfig } from "@/lib/actions/corretor-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Corretor } from "@/types";

interface AbaSiteProps {
  corretor: Corretor;
}

export function AbaSite({ corretor }: AbaSiteProps) {
  const [dominioCustom, setDominioCustom] = useState(corretor.dominio_custom ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const siteUrl = corretor.slug ? `/${corretor.slug}` : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveSiteConfig({ dominio_custom: dominioCustom });

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.message ?? "Site salvo.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu site</CardTitle>
        <CardDescription>
          Endereço público do seu site de imóveis no FX Studio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug do site</Label>
            <Input id="slug" value={corretor.slug} readOnly disabled />
            {siteUrl ? (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-secondary hover:underline"
              >
                Ver site
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dominio_custom">Domínio personalizado</Label>
            <Input
              id="dominio_custom"
              value={dominioCustom}
              onChange={(event) => setDominioCustom(event.target.value)}
              placeholder="www.seudominio.com.br (em breve)"
            />
            <p className="text-xs text-muted-foreground">
              Placeholder para domínio customizado — recurso em desenvolvimento.
            </p>
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
            {isPending ? "Salvando..." : "Salvar site"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
