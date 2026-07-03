"use client";

import { useRef, useState, useTransition } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";

import {
  removeHero,
  saveContatoPage,
  saveIdentidadeVisual,
  saveSiteDominio,
  saveSobrePage,
  uploadHero,
  uploadLogo,
  uploadSobreFoto,
} from "@/lib/actions/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SITE_COR_PRIMARIA,
  DEFAULT_SITE_COR_SECUNDARIA,
} from "@/lib/constants/site";
import type { Corretor } from "@/types";

interface AbaSiteProps {
  corretor: Corretor;
}

function FeedbackMessage({ error, message }: { error: string | null; message: string | null }) {
  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (message) {
    return (
      <p className="text-sm text-secondary" role="status">
        {message}
      </p>
    );
  }

  return null;
}

function IdentidadeVisualTab({ corretor }: { corretor: Corretor }) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(corretor.logo_url ?? "");
  const [corPrimaria, setCorPrimaria] = useState(
    corretor.site_cor_primaria ?? DEFAULT_SITE_COR_PRIMARIA,
  );
  const [corSecundaria, setCorSecundaria] = useState(
    corretor.site_cor_secundaria ?? DEFAULT_SITE_COR_SECUNDARIA,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    setError(null);

    const formData = new FormData();
    formData.set("logo", file);

    startTransition(async () => {
      const result = await uploadLogo(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) setLogoUrl(result.url);
      setFeedback(result.message ?? "Logo enviada.");
    });
  }

  function handleSaveCores(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveIdentidadeVisual({
        site_cor_primaria: corPrimaria,
        site_cor_secundaria: corSecundaria,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.message ?? "Cores salvas.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Logo do site</Label>
        <div className="flex flex-wrap items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="max-h-14 max-w-[160px] object-contain" />
          ) : (
            <div className="flex h-14 w-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              Sem logo
            </div>
          )}
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => logoInputRef.current?.click()}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enviar logo
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveCores} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cor-primaria">Cor primária</Label>
            <div className="flex items-center gap-2">
              <input
                id="cor-primaria"
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="size-10 cursor-pointer rounded border border-border"
              />
              <Input
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cor-secundaria">Cor secundária</Label>
            <div className="flex items-center gap-2">
              <input
                id="cor-secundaria"
                type="color"
                value={corSecundaria}
                onChange={(e) => setCorSecundaria(e.target.value)}
                className="size-10 cursor-pointer rounded border border-border"
              />
              <Input
                value={corSecundaria}
                onChange={(e) => setCorSecundaria(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-lg border border-border p-4"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
          }}
        >
          <p className="text-sm font-medium text-white">Pré-visualização das cores</p>
        </div>

        <FeedbackMessage error={error} message={feedback} />

        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar identidade visual
        </Button>
      </form>
    </div>
  );
}

function HeroTab({ corretor }: { corretor: Corretor }) {
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [heroUrl, setHeroUrl] = useState(corretor.hero_image_url ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    setError(null);

    const formData = new FormData();
    formData.set("hero", file);

    startTransition(async () => {
      const result = await uploadHero(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) setHeroUrl(result.url);
      setFeedback(result.message ?? "Hero enviado.");
    });
  }

  function handleRemove() {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await removeHero();
      if (result.error) {
        setError(result.error);
        return;
      }
      setHeroUrl("");
      setFeedback(result.message ?? "Hero removido.");
    });
  }

  return (
    <div className="space-y-4">
      {heroUrl ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroUrl} alt="Hero" className="aspect-[21/9] w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[21/9] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
          Nenhuma imagem de hero configurada
        </div>
      )}

      <input
        ref={heroInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => heroInputRef.current?.click()}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {heroUrl ? "Substituir imagem" : "Enviar imagem"}
        </Button>
        {heroUrl ? (
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleRemove}>
            <Trash2 className="size-4" />
            Remover
          </Button>
        ) : null}
      </div>

      <FeedbackMessage error={error} message={feedback} />
    </div>
  );
}

function SobreTab({ corretor }: { corretor: Corretor }) {
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState(corretor.sobre_titulo ?? "");
  const [texto, setTexto] = useState(corretor.sobre_texto ?? corretor.sobre ?? "");
  const [fotoUrl, setFotoUrl] = useState(corretor.sobre_foto_url ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    setError(null);

    const formData = new FormData();
    formData.set("foto", file);

    startTransition(async () => {
      const result = await uploadSobreFoto(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) setFotoUrl(result.url);
      setFeedback(result.message ?? "Foto enviada.");
    });
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveSobrePage({ sobre_titulo: titulo, sobre_texto: texto });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.message ?? "Página Sobre salva.");
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sobre-titulo">Título</Label>
        <Input
          id="sobre-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Sobre mim"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sobre-texto">Texto</Label>
        <Textarea
          id="sobre-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          placeholder="Conte sua história e experiência..."
        />
      </div>

      <div className="space-y-2">
        <Label>Foto</Label>
        <div className="flex flex-wrap items-center gap-4">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl}
              alt="Sobre"
              className="size-24 rounded-lg object-cover"
            />
          ) : null}
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => fotoInputRef.current?.click()}
          >
            Enviar foto
          </Button>
        </div>
      </div>

      <FeedbackMessage error={error} message={feedback} />

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Salvar página Sobre
      </Button>
    </form>
  );
}

function ContatoTab({ corretor }: { corretor: Corretor }) {
  const [email, setEmail] = useState(corretor.contato_email ?? corretor.email ?? "");
  const [telefone, setTelefone] = useState(
    corretor.contato_telefone ?? corretor.telefone ?? "",
  );
  const [endereco, setEndereco] = useState(corretor.contato_endereco ?? "");
  const [horario, setHorario] = useState(corretor.contato_horario ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await saveContatoPage({
        contato_email: email,
        contato_telefone: telefone,
        contato_endereco: endereco,
        contato_horario: horario,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.message ?? "Contato salvo.");
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contato-email">E-mail</Label>
          <Input
            id="contato-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contato-telefone">Telefone</Label>
          <Input
            id="contato-telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contato-endereco">Endereço</Label>
        <Textarea
          id="contato-endereco"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contato-horario">Horário de atendimento</Label>
        <Input
          id="contato-horario"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          placeholder="Seg a Sex, 9h às 18h"
        />
      </div>

      <FeedbackMessage error={error} message={feedback} />

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Salvar página Contato
      </Button>
    </form>
  );
}

export function AbaSite({ corretor }: AbaSiteProps) {
  const [dominioCustom, setDominioCustom] = useState(corretor.dominio_custom ?? "");
  const [dominioFeedback, setDominioFeedback] = useState<string | null>(null);
  const [dominioError, setDominioError] = useState<string | null>(null);
  const [isDominioPending, startDominioTransition] = useTransition();

  const siteUrl = corretor.slug ? `/${corretor.slug}` : null;

  function handleDominioSubmit(event: React.FormEvent) {
    event.preventDefault();
    setDominioFeedback(null);
    setDominioError(null);

    startDominioTransition(async () => {
      const result = await saveSiteDominio({ dominio_custom: dominioCustom });
      if (result.error) {
        setDominioError(result.error);
        return;
      }
      setDominioFeedback(result.message ?? "Domínio salvo.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site público</CardTitle>
        <CardDescription>
          Personalize a identidade visual, conteúdo e páginas do seu site de imóveis.
        </CardDescription>
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
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleDominioSubmit} className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug do site</Label>
            <Input id="slug" value={corretor.slug} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dominio_custom">Domínio personalizado</Label>
            <Input
              id="dominio_custom"
              value={dominioCustom}
              onChange={(event) => setDominioCustom(event.target.value)}
              placeholder="www.seudominio.com.br (em breve)"
            />
          </div>
          <FeedbackMessage error={dominioError} message={dominioFeedback} />
          <Button type="submit" size="sm" variant="outline" disabled={isDominioPending}>
            Salvar domínio
          </Button>
        </form>

        <Tabs defaultValue="identidade" className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="identidade">Identidade Visual</TabsTrigger>
            <TabsTrigger value="hero">Imagem do Hero</TabsTrigger>
            <TabsTrigger value="sobre">Página Sobre</TabsTrigger>
            <TabsTrigger value="contato">Página Contato</TabsTrigger>
          </TabsList>

          <TabsContent value="identidade" className="mt-4">
            <IdentidadeVisualTab corretor={corretor} />
          </TabsContent>
          <TabsContent value="hero" className="mt-4">
            <HeroTab corretor={corretor} />
          </TabsContent>
          <TabsContent value="sobre" className="mt-4">
            <SobreTab corretor={corretor} />
          </TabsContent>
          <TabsContent value="contato" className="mt-4">
            <ContatoTab corretor={corretor} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
