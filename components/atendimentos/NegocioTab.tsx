"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNegocio } from "@/lib/actions/atendimentos";
import { formatCurrency } from "@/lib/site/format";
import { toast } from "@/hooks/use-toast";
import type { Imovel, Negocio, Proposta } from "@/types";

interface NegocioTabProps {
  leadId: string;
  negocios: Negocio[];
  propostas: Proposta[];
  imoveis: Imovel[];
}

export function NegocioTab({ leadId, negocios, propostas, imoveis }: NegocioTabProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [imovelId, setImovelId] = useState("");
  const [propostaId, setPropostaId] = useState("");
  const [valor, setValor] = useState<number | null>(null);
  const [comissao, setComissao] = useState<number | null>(null);
  const [dataFechamento, setDataFechamento] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function registrar() {
    if (!imovelId || valor === null) {
      toast({ variant: "destructive", title: "Preencha imóvel e valor." });
      return;
    }
    startTransition(async () => {
      const result = await createNegocio(leadId, {
        imovel_id: imovelId,
        proposta_id: propostaId || undefined,
        valor_fechamento: valor,
        valor_comissao: comissao ?? undefined,
        data_fechamento: dataFechamento,
        forma_pagamento: formaPagamento || undefined,
        observacoes,
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Negócio fechado</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Registrar fechamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar negócio fechado</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Imóvel</Label>
                <Select value={imovelId} onValueChange={setImovelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {imoveis.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.titulo ?? i.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {propostas.length > 0 ? (
                <div>
                  <Label>Proposta vinculada (opcional)</Label>
                  <Select value={propostaId} onValueChange={setPropostaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {propostas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {formatCurrency(Number(p.valor_proposto))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div>
                <Label>Valor de fechamento</Label>
                <CurrencyInput value={valor} onChange={setValor} />
              </div>
              <div>
                <Label>Comissão (opcional)</Label>
                <CurrencyInput value={comissao} onChange={setComissao} />
              </div>
              <div>
                <Label htmlFor="data_fechamento">Data do fechamento</Label>
                <Input
                  id="data_fechamento"
                  type="date"
                  value={dataFechamento}
                  onChange={(e) => setDataFechamento(e.target.value)}
                />
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avista">À vista</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="consorcio">Consórcio</SelectItem>
                    <SelectItem value="permuta">Permuta</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="obs_negocio">Observações</Label>
                <Textarea
                  id="obs_negocio"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <Button onClick={registrar} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {negocios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum negócio fechado registrado.</p>
      ) : (
        <ul className="space-y-3">
          {negocios.map((negocio) => (
            <li key={negocio.id} className="rounded-xl border border-border p-3">
              <p className="font-medium">
                {negocio.imovel?.titulo ?? negocio.imovel?.codigo}
              </p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(Number(negocio.valor_fechamento))}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(negocio.data_fechamento), "dd/MM/yyyy")}
                {negocio.valor_comissao
                  ? ` · Comissão ${formatCurrency(Number(negocio.valor_comissao))}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
