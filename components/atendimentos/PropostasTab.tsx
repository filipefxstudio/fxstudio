"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Handshake, Loader2, Plus, Trash2 } from "lucide-react";

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
import {
  createNegocio,
  createProposta,
  deleteProposta,
  marcarNegocioPerdido,
  updatePropostaStatus,
} from "@/lib/actions/atendimentos";
import { formatCurrency } from "@/lib/site/format";
import { toast } from "@/hooks/use-toast";
import type { Imovel, Proposta, StatusProposta } from "@/types";

interface PropostasTabProps {
  leadId: string;
  propostas: Proposta[];
  imoveis: Imovel[];
}

const STATUS_OPTIONS: { value: StatusProposta; label: string }[] = [
  { value: "em_analise", label: "Em análise" },
  { value: "aceita", label: "Aceita" },
  { value: "recusada", label: "Recusada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "contraproposta", label: "Contraproposta" },
];

export function PropostasTab({ leadId, propostas, imoveis }: PropostasTabProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fecharOpen, setFecharOpen] = useState<Proposta | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imovelId, setImovelId] = useState("");
  const [valor, setValor] = useState<number | null>(null);
  const [dataProposta, setDataProposta] = useState(new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState("");
  const [valorFechamento, setValorFechamento] = useState<number | null>(null);
  const [comissao, setComissao] = useState<number | null>(null);
  const [dataFechamento, setDataFechamento] = useState(new Date().toISOString().slice(0, 10));
  const [formaPagamento, setFormaPagamento] = useState("");

  function registrar() {
    if (!imovelId || valor === null) {
      toast({ variant: "destructive", title: "Preencha imóvel e valor." });
      return;
    }
    startTransition(async () => {
      const result = await createProposta(leadId, {
        imovel_id: imovelId,
        valor_proposto: valor,
        data_proposta: dataProposta,
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

  function fecharNegocio() {
    if (!fecharOpen || valorFechamento === null) return;
    startTransition(async () => {
      const result = await createNegocio(leadId, {
        imovel_id: fecharOpen.imovel_id!,
        proposta_id: fecharOpen.id,
        valor_fechamento: valorFechamento,
        valor_comissao: comissao ?? undefined,
        data_fechamento: dataFechamento,
        forma_pagamento: formaPagamento || undefined,
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setFecharOpen(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-primary">Propostas</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const r = await marcarNegocioPerdido(leadId);
                toast({ title: r.message, variant: r.error ? "destructive" : "default" });
                router.refresh();
              })
            }
          >
            Negócio perdido
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Nova proposta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar proposta</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Imóvel</Label>
                  <Select value={imovelId} onValueChange={setImovelId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {imoveis.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.titulo ?? i.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor proposto</Label>
                  <CurrencyInput value={valor} onChange={setValor} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={dataProposta} onChange={(e) => setDataProposta(e.target.value)} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                </div>
                <Button onClick={registrar} disabled={isPending} className="w-full">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : "Registrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {propostas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma proposta registrada.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {propostas.map((proposta) => (
            <div key={proposta.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{proposta.imovel?.titulo ?? proposta.imovel?.codigo}</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(Number(proposta.valor_proposto))}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(proposta.data_proposta), "dd/MM/yyyy")} · {proposta.status}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Select
                  value={proposta.status}
                  onValueChange={(v) =>
                    startTransition(async () => {
                      await updatePropostaStatus(proposta.id, v as StatusProposta);
                      router.refresh();
                    })
                  }
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {proposta.status === "aceita" ? (
                  <Button size="sm" onClick={() => {
                    setFecharOpen(proposta);
                    setValorFechamento(Number(proposta.valor_proposto));
                  }}>
                    <Handshake className="size-3.5" />
                    Fechar negócio
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteProposta(proposta.id);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(fecharOpen)} onOpenChange={(o) => !o && setFecharOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fechar negócio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor de fechamento</Label>
              <CurrencyInput value={valorFechamento} onChange={setValorFechamento} />
            </div>
            <div>
              <Label>Comissão</Label>
              <CurrencyInput value={comissao} onChange={setComissao} />
            </div>
            <div>
              <Label>Data fechamento</Label>
              <Input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} />
            </div>
            <div>
              <Label>Forma pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="avista">À vista</SelectItem>
                  <SelectItem value="financiamento">Financiamento</SelectItem>
                  <SelectItem value="consorcio">Consórcio</SelectItem>
                  <SelectItem value="permuta">Permuta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fecharNegocio} disabled={isPending} className="w-full">
              Confirmar fechamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
