"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  descartarAtendimento,
  excluirAtendimento,
  transferirAtendimento,
} from "@/lib/actions/atendimentos";
import { toast } from "@/hooks/use-toast";
import type { MotivoDescarte } from "@/types";

interface AtendimentoModalsProps {
  leadId: string;
  leadNome?: string | null;
  perfis: { id: string; nome: string }[];
  motivos: MotivoDescarte[];
  podeTransferir: boolean;
  podeExcluir?: boolean;
  descartarOpen: boolean;
  transferirOpen: boolean;
  excluirOpen?: boolean;
  onDescartarOpenChange: (open: boolean) => void;
  onTransferirOpenChange: (open: boolean) => void;
  onExcluirOpenChange?: (open: boolean) => void;
}

export function AtendimentoModals({
  leadId,
  leadNome,
  perfis,
  motivos,
  podeTransferir,
  podeExcluir,
  descartarOpen,
  transferirOpen,
  excluirOpen = false,
  onDescartarOpenChange,
  onTransferirOpenChange,
  onExcluirOpenChange,
}: AtendimentoModalsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [motivoId, setMotivoId] = useState("");
  const [obsDescarte, setObsDescarte] = useState("");
  const [perfilDestino, setPerfilDestino] = useState("");
  const [motivoExclusao, setMotivoExclusao] = useState("");

  function handleDescartar() {
    if (!motivoId) {
      toast({ variant: "destructive", title: "Selecione um motivo." });
      return;
    }
    startTransition(async () => {
      const result = await descartarAtendimento(leadId, motivoId, obsDescarte);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      onDescartarOpenChange(false);
      router.refresh();
    });
  }

  function handleTransferir() {
    if (!perfilDestino) {
      toast({ variant: "destructive", title: "Selecione o responsável." });
      return;
    }
    startTransition(async () => {
      const result = await transferirAtendimento(leadId, perfilDestino);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      onTransferirOpenChange(false);
      router.refresh();
    });
  }

  function handleExcluir() {
    if (!motivoExclusao.trim()) {
      toast({ variant: "destructive", title: "Informe o motivo da exclusão." });
      return;
    }
    startTransition(async () => {
      const result = await excluirAtendimento(leadId, motivoExclusao);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      onExcluirOpenChange?.(false);
      router.push("/dashboard/atendimentos");
      router.refresh();
    });
  }

  return (
    <>
      <Dialog open={descartarOpen} onOpenChange={onDescartarOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar atendimento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {leadNome ? `Descartar ${leadNome}?` : "Este atendimento será marcado como descartado."}
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={motivoId} onValueChange={setMotivoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {motivos.filter((m) => m.ativo).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={obsDescarte}
                onChange={(e) => setObsDescarte(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={isPending}
              onClick={handleDescartar}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar descarte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {podeTransferir ? (
        <Dialog open={transferirOpen} onOpenChange={onTransferirOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferir atendimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Novo responsável</Label>
                <Select value={perfilDestino} onValueChange={setPerfilDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" disabled={isPending} onClick={handleTransferir}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Transferir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {podeExcluir ? (
        <Dialog open={excluirOpen} onOpenChange={(open) => onExcluirOpenChange?.(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir atendimento</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {leadNome
                ? `Excluir permanentemente o atendimento de ${leadNome}?`
                : "Esta ação não pode ser desfeita."}
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Textarea
                  value={motivoExclusao}
                  onChange={(e) => setMotivoExclusao(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isPending}
                onClick={handleExcluir}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar exclusão"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
