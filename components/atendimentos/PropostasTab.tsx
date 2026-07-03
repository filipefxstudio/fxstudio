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
import { createProposta, updatePropostaStatus } from "@/lib/actions/atendimentos";
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
  const [isPending, startTransition] = useTransition();
  const [imovelId, setImovelId] = useState("");
  const [valor, setValor] = useState<number | null>(null);
  const [dataProposta, setDataProposta] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [observacoes, setObservacoes] = useState("");

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

  function alterarStatus(propostaId: string, status: StatusProposta) {
    startTransition(async () => {
      const result = await updatePropostaStatus(propostaId, status);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Propostas</h3>
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
              <div>
                <Label>Valor proposto</Label>
                <CurrencyInput value={valor} onChange={setValor} />
              </div>
              <div>
                <Label htmlFor="data_proposta">Data</Label>
                <Input
                  id="data_proposta"
                  type="date"
                  value={dataProposta}
                  onChange={(e) => setDataProposta(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="obs_proposta">Observações</Label>
                <Textarea
                  id="obs_proposta"
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

      {propostas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma proposta registrada.</p>
      ) : (
        <ul className="space-y-3">
          {propostas.map((proposta) => (
            <li key={proposta.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">
                    {proposta.imovel?.titulo ?? proposta.imovel?.codigo}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(Number(proposta.valor_proposto))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(proposta.data_proposta), "dd/MM/yyyy")} · {proposta.status}
                  </p>
                </div>
                <Select
                  value={proposta.status}
                  onValueChange={(v) => alterarStatus(proposta.id, v as StatusProposta)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
