"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Copy, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVisita, removerImovelSelecionado } from "@/lib/actions/atendimentos";
import { formatCurrency, getCapaUrl } from "@/lib/site/format";
import { toast } from "@/hooks/use-toast";
import type { LeadImovelSelecionado } from "@/types";

interface ImoveisSelecionadosTabProps {
  leadId: string;
  selecionados: LeadImovelSelecionado[];
  imovelInteresseId?: string | null;
}

export function ImoveisSelecionadosTab({
  leadId,
  selecionados,
  imovelInteresseId,
}: ImoveisSelecionadosTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visitaOpen, setVisitaOpen] = useState<string | null>(null);
  const [dataVisita, setDataVisita] = useState("");
  const [obsVisita, setObsVisita] = useState("");

  function remover(imovelId: string) {
    startTransition(async () => {
      const result = await removerImovelSelecionado(leadId, imovelId);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }

  function copiarLink(token: string) {
    const url = `${window.location.origin}/preview/imovel/${token}`;
    void navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  }

  function agendarVisita(imovelId: string) {
    if (!dataVisita) {
      toast({ variant: "destructive", title: "Informe data e hora." });
      return;
    }
    startTransition(async () => {
      const result = await createVisita(leadId, {
        imovel_id: imovelId,
        data_visita: dataVisita,
        observacoes: obsVisita,
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setVisitaOpen(null);
      router.refresh();
    });
  }

  if (selecionados.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum imóvel selecionado. Use o Radar para adicionar imóveis compatíveis.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {selecionados.map((item) => {
        const imovel = item.imovel;
        const valor = imovel?.valor_venda ?? imovel?.valor_locacao;
        const capa = imovel ? getCapaUrl(imovel) : null;
        const isInteresseInicial = item.imovel_id === imovelInteresseId;

        return (
          <div key={item.id} className="overflow-hidden rounded-xl border border-border">
            <div className="flex gap-3 p-3">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {capa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capa} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{imovel?.titulo ?? imovel?.codigo}</p>
                  {isInteresseInicial ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      Interesse inicial
                    </span>
                  ) : null}
                </div>
                {valor ? (
                  <p className="text-sm text-muted-foreground">{formatCurrency(valor)}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">{imovel?.bairro}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-3">
              <Button size="sm" variant="outline" onClick={() => setVisitaOpen(item.imovel_id)}>
                <Calendar className="size-3.5" />
                Agendar visita
              </Button>
              <Button size="sm" variant="outline" onClick={() => copiarLink(item.token_compartilhamento)}>
                <Copy className="size-3.5" />
                Compartilhar
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`/preview/imovel/${item.token_compartilhamento}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" disabled={isPending} onClick={() => remover(item.imovel_id)}>
                <Trash2 className="size-3.5" />
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/dashboard/imoveis/${item.imovel_id}`} target="_blank">
                  Ver imóvel
                </Link>
              </Button>
            </div>
          </div>
        );
      })}

      <Dialog open={Boolean(visitaOpen)} onOpenChange={(o) => !o && setVisitaOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data e hora</Label>
              <Input type="datetime-local" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obsVisita} onChange={(e) => setObsVisita(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => visitaOpen && agendarVisita(visitaOpen)}
            >
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
