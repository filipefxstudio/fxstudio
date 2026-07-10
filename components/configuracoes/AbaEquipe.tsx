"use client";

import { Loader2, MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import { useRef, useState, useTransition, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  convidarPerfil,
  editarPerfil,
  excluirPerfil,
  togglePerfilAtivo,
} from "@/lib/actions/configuracoes";
import { EQUIPE_LIMITE_USUARIOS } from "@/lib/constants/imoveis";
import type { PapelUsuario, Perfil } from "@/types";

interface AbaEquipeProps {
  perfis: Perfil[];
  adminPrincipalUserId: string;
}

const papelLabels: Record<PapelUsuario, string> = {
  admin: "Admin",
  gerente: "Gerente/Diretor",
  corretor: "Corretor",
};

export function AbaEquipe({ perfis: initialPerfis, adminPrincipalUserId }: AbaEquipeProps) {
  const [perfis, setPerfis] = useState(initialPerfis);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [papel, setPapel] = useState<PapelUsuario>("corretor");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Perfil | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPapel, setEditPapel] = useState<PapelUsuario>("corretor");

  function isPrincipal(perfil: Perfil) {
    return perfil.user_id === adminPrincipalUserId;
  }

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

  function openEdit(perfil: Perfil) {
    setSelected(perfil);
    setEditNome(perfil.nome);
    setEditEmail(perfil.email);
    setEditPapel(perfil.papel);
    setEditOpen(true);
  }

  function openDelete(perfil: Perfil) {
    setSelected(perfil);
    setDeleteOpen(true);
  }

  function handleEdit() {
    if (!selected) return;
    startTransition(async () => {
      const result = await editarPerfil(selected.id, {
        nome: editNome,
        email: editEmail,
        papel: editPapel,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setPerfis((prev) =>
        prev.map((p) =>
          p.id === selected.id
            ? { ...p, nome: editNome, email: editEmail, papel: editPapel }
            : p,
        ),
      );
      setEditOpen(false);
      setFeedback(result.message ?? "Perfil atualizado.");
    });
  }

  function handleDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await excluirPerfil(selected.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPerfis((prev) => prev.filter((p) => p.id !== selected.id));
      setDeleteOpen(false);
      setFeedback(result.message ?? "Perfil excluído.");
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
                  <p className="font-medium">
                    {perfil.nome}
                    {isPrincipal(perfil) ? (
                      <span className="ml-2 text-xs text-muted-foreground">(principal)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{perfil.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {papelLabels[perfil.papel]}
                  </span>
                  {!isPrincipal(perfil) ? (
                    <Switch
                      checked={perfil.ativo}
                      onCheckedChange={(checked) => handleToggle(perfil.id, checked)}
                      disabled={isPending}
                    />
                  ) : null}
                  <EquipeAcoesMenu
                    perfil={perfil}
                    isPrincipal={isPrincipal(perfil)}
                    onEdit={() => openEdit(perfil)}
                    onDelete={() => openDelete(perfil)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={editPapel} onValueChange={(v) => setEditPapel(v as PapelUsuario)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="corretor">Corretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={isPending} onClick={handleEdit}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir membro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Excluir {selected?.nome}? Esta ação não pode ser desfeita.
          </p>
          <Button variant="destructive" className="w-full" disabled={isPending} onClick={handleDelete}>
            Confirmar exclusão
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EquipeAcoesMenu({
  perfil,
  isPrincipal,
  onEdit,
  onDelete,
}: {
  perfil: Perfil;
  isPrincipal: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-lg border border-border p-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Ações de ${perfil.nome}`}
      >
        <MoreVertical className="size-4" />
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 min-w-36 rounded-lg border bg-card py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
          {!isPrincipal ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
