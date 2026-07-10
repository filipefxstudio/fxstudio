"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  deleteMotivoDesativacao,
  getMotivosDesativacao,
  saveMotivoDesativacao,
} from "@/lib/actions/configuracoes";
import type { MotivoDesativacao } from "@/types";

interface AbaMotivosDesativacaoProps {
  initialMotivos: MotivoDesativacao[];
}

export function AbaMotivosDesativacao({ initialMotivos }: AbaMotivosDesativacaoProps) {
  const [motivos, setMotivos] = useState(initialMotivos);
  const [novoMotivo, setNovoMotivo] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!novoMotivo.trim()) return;
    startTransition(async () => {
      await saveMotivoDesativacao({ nome: novoMotivo.trim() });
      setNovoMotivo("");
      setMotivos(await getMotivosDesativacao());
    });
  }

  function toggleMotivo(motivo: MotivoDesativacao) {
    startTransition(async () => {
      await saveMotivoDesativacao({ id: motivo.id, nome: motivo.nome, ativo: !motivo.ativo });
      setMotivos(await getMotivosDesativacao());
    });
  }

  function excluir(id: string) {
    startTransition(async () => {
      await deleteMotivoDesativacao(id);
      setMotivos(await getMotivosDesativacao());
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de desativação</CardTitle>
        <CardDescription>Usados ao desativar um imóvel no CRM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Novo motivo"
            value={novoMotivo}
            onChange={(e) => setNovoMotivo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          />
          <Button type="button" onClick={handleAdd} disabled={isPending}>
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {motivos.map((motivo) => (
            <li key={motivo.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch checked={motivo.ativo} onCheckedChange={() => toggleMotivo(motivo)} />
                <span className={motivo.ativo ? "" : "text-muted-foreground line-through"}>
                  {motivo.nome}
                </span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => excluir(motivo.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        {isPending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </CardContent>
    </Card>
  );
}
