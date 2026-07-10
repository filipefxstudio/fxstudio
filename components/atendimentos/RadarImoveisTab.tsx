"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BedDouble, Bath, Car, ExternalLink, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { selecionarImovel } from "@/lib/actions/atendimentos";
import { formatCurrency, getCapaUrl, getFinalidadeLabel, getTipoLabel } from "@/lib/site/format";
import { getImovelCodigo, getValorNumerico } from "@/lib/imoveis/format";
import { toast } from "@/hooks/use-toast";
import type { Imovel, LeadImovelSelecionado } from "@/types";

interface RadarImoveisTabProps {
  leadId: string;
  imoveis: Imovel[];
  selecionados: LeadImovelSelecionado[];
  imovelInteresseId?: string | null;
}

export function RadarImoveisTab({
  leadId,
  imoveis,
  selecionados,
  imovelInteresseId,
}: RadarImoveisTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selecionadosIds = new Set(selecionados.map((s) => s.imovel_id));

  function handleSelecionar(imovelId: string) {
    startTransition(async () => {
      const result = await selecionarImovel(leadId, imovelId);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }

  if (imoveis.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum imóvel compatível com as preferências do atendimento.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {imoveis.map((imovel) => {
        const capa = getCapaUrl(imovel);
        const codigo = getImovelCodigo(imovel);
        const valor = getValorNumerico(imovel);
        const jaSelecionado = selecionadosIds.has(imovel.id);
        const isInteresseInicial = imovel.id === imovelInteresseId;

        return (
          <article
            key={imovel.id}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <a
              href={`/dashboard/imoveis/${imovel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {capa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capa} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                    Sem foto
                  </div>
                )}
                {isInteresseInicial ? (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
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
            </a>
            <div className="flex gap-2 border-t border-border p-3">
              <Button
                size="sm"
                variant={jaSelecionado ? "secondary" : "default"}
                className="flex-1"
                disabled={isPending || jaSelecionado}
                onClick={() => handleSelecionar(imovel.id)}
              >
                <Plus className="size-3.5" />
                {jaSelecionado ? "Selecionado ✓" : "Selecionar"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`/dashboard/imoveis/${imovel.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
