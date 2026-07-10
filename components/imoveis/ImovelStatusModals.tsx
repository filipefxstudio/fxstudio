"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "@/hooks/use-toast";
import { getMotivosDesativacao } from "@/lib/actions/configuracoes";
import { desativarImovel, updateImovelStatus } from "@/lib/actions/imoveis";
import { MOTIVOS_DESATIVACAO } from "@/lib/constants/imoveis";
import type { MotivoDesativacao, StatusImovel } from "@/types";

interface ImovelDesativarModalProps {
  imovelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImovelDesativarModal({
  imovelId,
  open,
  onOpenChange,
  onSuccess,
}: ImovelDesativarModalProps) {
  const [motivo, setMotivo] = useState("");
  const [infoAdicional, setInfoAdicional] = useState("");
  const [motivos, setMotivos] = useState<string[]>([...MOTIVOS_DESATIVACAO]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    void getMotivosDesativacao().then((items: MotivoDesativacao[]) => {
      const ativos = items.filter((item) => item.ativo).map((item) => item.nome);
      if (ativos.length > 0) {
        setMotivos(ativos);
      }
    });
  }, [open]);

  function handleSubmit() {
    startTransition(async () => {
      const result = await desativarImovel(imovelId, motivo, infoAdicional);

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }

      toast({ title: "Imóvel desativado." });
      setMotivo("");
      setInfoAdicional("");
      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar imóvel</DialogTitle>
          <DialogDescription>
            O imóvel será removido da publicação e marcado como desativado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {motivo === "Outro" ? (
            <div className="space-y-2">
              <Label htmlFor="info-desativacao">Informações adicionais *</Label>
              <Textarea
                id="info-desativacao"
                rows={3}
                value={infoAdicional}
                onChange={(event) => setInfoAdicional(event.target.value)}
                placeholder="Descreva o motivo da desativação"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !motivo}>
            Desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImovelAlterarStatusModalProps {
  imovelId: string;
  statusList: StatusImovel[];
  statusId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (statusId: string) => void;
}

export function ImovelAlterarStatusModal({
  imovelId,
  statusList,
  statusId,
  open,
  onOpenChange,
  onSuccess,
}: ImovelAlterarStatusModalProps) {
  const [motivo, setMotivo] = useState("");
  const [isPending, startTransition] = useTransition();

  const status = statusList.find((item) => item.id === statusId);

  function handleSubmit() {
    if (!statusId) {
      return;
    }

    startTransition(async () => {
      const result = await updateImovelStatus(imovelId, statusId, motivo);

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }

      toast({ title: "Status atualizado." });
      setMotivo("");
      onOpenChange(false);
      onSuccess?.(statusId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar status</DialogTitle>
          <DialogDescription>
            {status
              ? `Confirme a alteração para "${status.nome}". O motivo é obrigatório.`
              : "Informe o motivo da alteração de status."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo-status">Motivo *</Label>
          <Textarea
            id="motivo-status"
            rows={3}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Descreva o motivo da alteração"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !motivo.trim() || !statusId}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
