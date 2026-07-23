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
import { createProposta } from "@/lib/actions/atendimentos";
import {
  MSG_PROPOSTA_SEM_PARECER,
  visitaTemParecerRegistrado,
} from "@/lib/atendimentos/regras";
import { toast } from "@/hooks/use-toast";
import type { Visita } from "@/types";

interface PropostaFromVisitaModalProps {
  leadId: string;
  visita: Visita | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropostaFromVisitaModal({
  leadId,
  visita,
  open,
  onOpenChange,
}: PropostaFromVisitaModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState("");

  useEffect(() => {
    if (!open) {
      setValor(null);
      setDetalhes("");
      return;
    }

    if (visita && !visitaTemParecerRegistrado(visita)) {
      toast({
        variant: "destructive",
        title: MSG_PROPOSTA_SEM_PARECER,
      });
      onOpenChange(false);
    }
  }, [open, visita, onOpenChange]);

  function fechar() {
    onOpenChange(false);
  }

  function cadastrar() {
    if (!visita?.imovel_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Esta visita não possui imóvel vinculado.",
      });
      return;
    }
    if (!visitaTemParecerRegistrado(visita)) {
      toast({
        variant: "destructive",
        title: MSG_PROPOSTA_SEM_PARECER,
      });
      return;
    }
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
      const result = await createProposta(leadId, {
        imovel_id: visita.imovel_id!,
        visita_id: visita.id,
        valor_proposto: valor,
        data_proposta: new Date().toISOString().slice(0, 10),
        observacoes: detalhes.trim(),
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      fechar();
      router.refresh();
    });
  }

  const imovel = visita?.imovel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar proposta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imovel ? (
            <ImovelAtendimentoResumo imovel={imovel} />
          ) : (
            <p className="text-sm text-muted-foreground">Imóvel não informado.</p>
          )}

          <div>
            <Label htmlFor="proposta-valor">Valor da proposta</Label>
            <CurrencyInput
              id="proposta-valor"
              value={valor}
              onChange={setValor}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="proposta-detalhes">Detalhes</Label>
            <Textarea
              id="proposta-detalhes"
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
            disabled={isPending || !imovel}
            onClick={cadastrar}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Cadastrar proposta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
