"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTelefoneBr } from "@/lib/imoveis/telefone";
import type { LeadAtivoInfo, PessoaAutocompleteItem } from "@/lib/pessoas/types";

interface AtendimentoAnteriorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: PessoaAutocompleteItem | null;
  atendimentoAnterior: LeadAtivoInfo | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function AtendimentoAnteriorModal({
  open,
  onOpenChange,
  pessoa,
  atendimentoAnterior,
  onConfirm,
  isPending,
}: AtendimentoAnteriorModalProps) {
  if (!pessoa || !atendimentoAnterior) {
    return null;
  }

  const dataDescarte = atendimentoAnterior.descartado_em
    ? new Date(atendimentoAnterior.descartado_em).toLocaleDateString("pt-BR")
    : "data não informada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastro encontrado</DialogTitle>
          <DialogDescription>
            Esta pessoa já está cadastrada. Deseja iniciar um novo atendimento?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">
            {pessoa.nome} — {formatTelefoneBr(pessoa.telefone)}
          </p>
          <p className="text-muted-foreground">
            Atendimento anterior: descartado em {dataDescarte}
          </p>
          {atendimentoAnterior.motivo_descarte ? (
            <p className="text-muted-foreground">
              Motivo: {atendimentoAnterior.motivo_descarte}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Criar novo atendimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
