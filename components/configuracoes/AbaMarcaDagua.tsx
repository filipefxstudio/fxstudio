"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getMarcaDaguaConfig,
  saveMarcaDaguaConfig,
  uploadMarcaDaguaLogo,
} from "@/lib/actions/configuracoes";
import { MARCA_DAGUA_POSICOES } from "@/lib/constants/imoveis";
import { cn } from "@/lib/utils";
import type { MarcaDaguaConfig } from "@/types";

interface AbaMarcaDaguaProps {
  initialConfig: MarcaDaguaConfig | null;
}

const PREVIEW_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop";

export function AbaMarcaDagua({ initialConfig }: AbaMarcaDaguaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<MarcaDaguaConfig | null>(initialConfig);
  const [tamanho, setTamanho] = useState(initialConfig?.tamanho_percent ?? 30);
  const [opacidade, setOpacidade] = useState(initialConfig?.opacidade_percent ?? 50);
  const [posicao, setPosicao] = useState(initialConfig?.posicao ?? "inferior_direito");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("logo", file);

    startTransition(async () => {
      const result = await uploadMarcaDaguaLogo(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      const updated = await getMarcaDaguaConfig();
      setConfig(updated);
      setFeedback(result.message ?? "Logo enviada.");
    });

    event.target.value = "";
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveMarcaDaguaConfig({
        tamanho_percent: tamanho,
        opacidade_percent: opacidade,
        posicao,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const updated = await getMarcaDaguaConfig();
      setConfig(updated);
      setFeedback(result.message ?? "Configurações salvas.");
    });
  }

  const posicaoStyles: Record<string, React.CSSProperties> = {
    centro: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    superior_esquerdo: { top: "8%", left: "8%" },
    superior_direito: { top: "8%", right: "8%" },
    inferior_esquerdo: { bottom: "8%", left: "8%" },
    inferior_direito: { bottom: "8%", right: "8%" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marca d&apos;água</CardTitle>
        <CardDescription>
          A marca d&apos;água será aplicada apenas em novas fotos enviadas após salvar a
          configuração.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Logo para marca d&apos;água</Label>
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                inputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            {config?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_url}
                alt="Logo marca d'água"
                className="mb-3 max-h-24 object-contain"
              />
            ) : (
              <Upload className="size-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {isPending ? "Enviando…" : "Arraste ou clique para enviar"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG com fundo transparente recomendado
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={isPending}
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tamanho">Tamanho: {tamanho}%</Label>
            <input
              id="tamanho"
              type="range"
              min={10}
              max={100}
              value={tamanho}
              onChange={(event) => setTamanho(Number(event.target.value))}
              className="w-full"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opacidade">Opacidade: {opacidade}%</Label>
            <input
              id="opacidade"
              type="range"
              min={10}
              max={100}
              value={opacidade}
              onChange={(event) => setOpacidade(Number(event.target.value))}
              className="w-full"
              disabled={isPending}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Posição</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MARCA_DAGUA_POSICOES.map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    posicao === item.value && "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="radio"
                    name="posicao"
                    value={item.value}
                    checked={posicao === item.value}
                    onChange={() => setPosicao(item.value)}
                    disabled={isPending}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Salvar configurações
          </Button>
        </form>

        <div className="space-y-2">
          <Label>Prévia</Label>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PREVIEW_IMAGE} alt="Prévia" className="size-full object-cover" />
            {config?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_url}
                alt=""
                className="absolute object-contain"
                style={{
                  width: `${tamanho}%`,
                  opacity: opacidade / 100,
                  ...posicaoStyles[posicao],
                }}
              />
            ) : null}
          </div>
          <p className="text-xs text-amber-600">
            A marca d&apos;água será aplicada apenas nas novas fotos enviadas. Fotos já cadastradas
            não serão alteradas.
          </p>
        </div>

        {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
