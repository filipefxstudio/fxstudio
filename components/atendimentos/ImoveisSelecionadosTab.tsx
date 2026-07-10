"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Bath,
  BedDouble,
  Calendar,
  Car,
  Copy,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";

import { ImovelInteresseAutocomplete } from "@/components/atendimentos/ImovelInteresseAutocomplete";
import { StatusBadge } from "@/components/imoveis/StatusBadge";
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
import {
  createVisita,
  removerImovelSelecionado,
  selecionarImovel,
} from "@/lib/actions/atendimentos";
import {
  formatCurrency,
  getCapaUrl,
  getFinalidadeLabel,
  getTipoLabel,
} from "@/lib/site/format";
import { getImovelCodigo, getValorNumerico } from "@/lib/imoveis/format";
import { contemNormalizado } from "@/lib/utils/normalizar";
import { toast } from "@/hooks/use-toast";
import type { Imovel, LeadImovelSelecionado } from "@/types";

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
  const [busca, setBusca] = useState("");
  const [visitaOpen, setVisitaOpen] = useState<string | null>(null);
  const [dataVisita, setDataVisita] = useState("");
  const [obsVisita, setObsVisita] = useState("");

  const filtrados = useMemo(() => {
    if (!busca.trim()) return selecionados;
    return selecionados.filter((item) => {
      const imovel = item.imovel;
      if (!imovel) return false;
      const campos = [imovel.titulo, imovel.codigo, imovel.bairro, imovel.logradouro];
      return campos.some((c) => contemNormalizado(c, busca));
    });
  }, [selecionados, busca]);

  function remover(imovelId: string) {
    if (imovelId === imovelInteresseId) {
      toast({
        variant: "destructive",
        title: "Não é possível remover o imóvel de interesse inicial.",
      });
      return;
    }
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

  function adicionarImovel(imovel: NonNullable<LeadImovelSelecionado["imovel"]>) {
    startTransition(async () => {
      const result = await selecionarImovel(leadId, imovel.id);
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
      <div className="space-y-2">
        <Label>Buscar imóvel para adicionar</Label>
        <ImovelInteresseAutocomplete
          value={null}
          onChange={(imovel) => {
            if (imovel) {
              const jaExiste = selecionados.some((s) => s.imovel_id === imovel.id);
              if (jaExiste) {
                toast({ title: "Imóvel já está na seleção." });
                return;
              }
              adicionarImovel(imovel as Imovel);
            }
          }}
          disabled={isPending}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filtrar imóveis selecionados"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum imóvel selecionado. Use o Radar ou a busca acima para adicionar imóveis.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((item) => (
            <SelecionadoCard
              key={item.id}
              item={item}
              imovelInteresseId={imovelInteresseId}
              disabled={isPending}
              onAgendar={() => setVisitaOpen(item.imovel_id)}
              onCompartilhar={() => copiarLink(item.token_compartilhamento)}
              onRemover={() => remover(item.imovel_id)}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(visitaOpen)} onOpenChange={(o) => !o && setVisitaOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={dataVisita}
                onChange={(e) => setDataVisita(e.target.value)}
              />
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

function SelecionadoCard({
  item,
  imovelInteresseId,
  disabled,
  onAgendar,
  onCompartilhar,
  onRemover,
}: {
  item: LeadImovelSelecionado;
  imovelInteresseId?: string | null;
  disabled: boolean;
  onAgendar: () => void;
  onCompartilhar: () => void;
  onRemover: () => void;
}) {
  const imovel = item.imovel;
  if (!imovel) return null;

  const capa = getCapaUrl(imovel);
  const codigo = getImovelCodigo(imovel);
  const valor = getValorNumerico(imovel);
  const isInteresseInicial =
    item.interesse_inicial || item.imovel_id === imovelInteresseId;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Link href={`/dashboard/imoveis/${imovel.id}`} className="block" target="_blank">
        <div className="relative aspect-[4/3] bg-muted">
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capa} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
          <div className="absolute left-2 top-2">
            <StatusBadge status={imovel.status} statusImovel={imovel.status_imovel} />
          </div>
          {isInteresseInicial ? (
            <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Interesse inicial
            </span>
          ) : null}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs text-muted-foreground">
            {getTipoLabel(imovel.tipo)} · {getFinalidadeLabel(imovel.finalidade)}
          </p>
          <p className="font-bold">{imovel.bairro ?? "—"}</p>
          <p className="text-sm font-semibold text-primary">{formatCurrency(valor)}</p>
          <p className="text-xs text-muted-foreground">{codigo}</p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5" /> {imovel.quartos}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" /> {imovel.banheiros}
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="size-3.5" /> {imovel.vagas}
            </span>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 border-t border-border p-3">
        <Button size="sm" variant="outline" onClick={onAgendar}>
          <Calendar className="size-3.5" />
          Agendar
        </Button>
        <Button size="sm" variant="outline" onClick={onCompartilhar}>
          <Copy className="size-3.5" />
          Compartilhar
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a
            href={`/preview/imovel/${item.token_compartilhamento}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled || isInteresseInicial}
          onClick={onRemover}
        >
          <Trash2 className="size-3.5" />
          Remover
        </Button>
      </div>
    </article>
  );
}
