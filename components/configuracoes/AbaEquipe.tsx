"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { convidarPerfil, togglePerfilAtivo } from "@/lib/actions/configuracoes";
import { EQUIPE_LIMITE_USUARIOS } from "@/lib/constants/imoveis";
import type { PapelUsuario, Perfil } from "@/types";

interface AbaEquipeProps {
  perfis: Perfil[];
}

const papelLabels: Record<PapelUsuario, string> = {
  admin: "Admin",
  gerente: "Gerente/Diretor",
  corretor: "Corretor",
};

export function AbaEquipe({ perfis: initialPerfis }: AbaEquipeProps) {
  const [perfis, setPerfis] = useState(initialPerfis);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [papel, setPapel] = useState<PapelUsuario>("corretor");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConvidar(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await convidarPerfil({ nome, email, telefone, papel });

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.message ?? "Convite enviado.");
      setShowForm(false);
      setNome("");
      setEmail("");
      setTelefone("");
      setPapel("corretor");
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      const result = await togglePerfilAtivo(id, ativo);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPerfis((prev) =>
        prev.map((perfil) => (perfil.id === id ? { ...perfil, ativo } : perfil)),
      );
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe</CardTitle>
        <CardDescription>
          Até {EQUIPE_LIMITE_USUARIOS} usuários com acesso ao painel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y rounded-lg border">
          {perfis.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum membro da equipe cadastrado.
            </li>
          ) : (
            perfis.map((perfil) => (
              <li
                key={perfil.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{perfil.nome}</p>
                  <p className="text-sm text-muted-foreground">{perfil.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {papelLabels[perfil.papel]}
                  </span>
                  <Switch
                    checked={perfil.ativo}
                    onCheckedChange={(checked) => handleToggle(perfil.id, checked)}
                    disabled={isPending}
                  />
                </div>
              </li>
            ))
          )}
        </ul>

        {showForm ? (
          <form onSubmit={handleConvidar} className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="equipe_nome">Nome</Label>
                <Input
                  id="equipe_nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipe_email">E-mail</Label>
                <Input
                  id="equipe_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="equipe_telefone">Telefone</Label>
                <Input
                  id="equipe_telefone"
                  value={telefone}
                  onChange={(event) => setTelefone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={papel} onValueChange={(v) => setPapel(v as PapelUsuario)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Enviar convite"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(true)}
            disabled={perfis.length >= EQUIPE_LIMITE_USUARIOS}
          >
            <UserPlus className="size-4" data-icon="inline-start" />
            Convidar
          </Button>
        )}

        {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
