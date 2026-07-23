"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { ImovelAtendimentoResumo } from "@/components/atendimentos/ImovelAtendimentoResumo";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProposta } from "@/lib/actions/atendimentos";
import { toast } from "@/hooks/use-toast";
import type { Proposta } from "@/types";

interface PropostaEditModalProps {
  proposta: Proposta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropostaEditModal({
  proposta,
  open,
  onOpenChange,
}: PropostaEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState("");

  useEffect(() => {
    if (open && proposta) {
      setValor(Number(proposta.valor_proposto));
      setDetalhes(proposta.observacoes?.trim() ?? "");
    }
    if (!open) {
      setValor(null);
      setDetalhes("");
    }
  }, [open, proposta]);

  function salvar() {
    if (!proposta) return;
    if (valor === null || valor <= 0) {
      toast({
        variant: "destructive",
        title: "Informe o valor da proposta.",
      });
      return;
    }
    if (!detalhes.trim()) {
      toast({
        variant: "destructive",
        title: "Informe os detalhes da proposta.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateProposta(proposta.id, {
        valor_proposto: valor,
        observacoes: detalhes.trim(),
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  const imovel = proposta?.imovel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar proposta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imovel ? (
            <ImovelAtendimentoResumo imovel={imovel} />
          ) : (
            <p className="text-sm text-muted-foreground">Imóvel não informado.</p>
          )}

          <div>
            <Label htmlFor="edit-proposta-valor">Valor da proposta</Label>
            <CurrencyInput
              id="edit-proposta-valor"
              value={valor}
              onChange={setValor}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="edit-proposta-detalhes">Detalhes</Label>
            <Textarea
              id="edit-proposta-detalhes"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Descreva condições, prazos e demais informações da proposta."
              rows={4}
              required
              disabled={isPending}
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={isPending || !proposta}
            onClick={salvar}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
