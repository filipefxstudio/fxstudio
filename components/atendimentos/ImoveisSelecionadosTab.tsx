"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Copy, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  removerImovelSelecionado,
  selecionarImovel,
} from "@/lib/actions/atendimentos";
import { formatCurrency } from "@/lib/site/format";
import { toast } from "@/hooks/use-toast";
import type { Imovel, LeadImovelSelecionado } from "@/types";

interface ImoveisSelecionadosTabProps {
  leadId: string;
  imoveisIndicados: Imovel[];
  selecionados: LeadImovelSelecionado[];
}

export function ImoveisSelecionadosTab({
  leadId,
  imoveisIndicados,
  selecionados,
}: ImoveisSelecionadosTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selecionadosIds = new Set(selecionados.map((s) => s.imovel_id));

  function adicionar(imovelId: string) {
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

  function remover(imovelId: string) {
    startTransition(async () => {
      await removerImovelSelecionado(leadId, imovelId);
      router.refresh();
    });
  }

  function copiarLink(token: string) {
    const url = `${window.location.origin}/preview/imovel/${token}`;
    void navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-semibold text-primary">Selecionados para compartilhar</h3>
        {selecionados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Selecione imóveis indicados para gerar link de preview.
          </p>
        ) : (
          <div className="space-y-3">
            {selecionados.map((item) => {
              const imovel = item.imovel;
              const valor = imovel?.valor_venda ?? imovel?.valor_locacao;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{imovel?.titulo ?? imovel?.codigo}</p>
                    {valor ? (
                      <p className="text-sm text-muted-foreground">{formatCurrency(valor)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copiarLink(item.token_compartilhamento)}
                    >
                      <Copy className="size-3.5" />
                      Copiar link
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`/preview/imovel/${item.token_compartilhamento}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5" />
                        Preview
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => remover(item.imovel_id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-primary">Adicionar da lista indicada</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {imoveisIndicados
            .filter((i) => !selecionadosIds.has(i.id))
            .map((imovel) => (
              <button
                key={imovel.id}
                type="button"
                disabled={isPending}
                className="rounded-lg border border-dashed border-border p-3 text-left text-sm hover:bg-muted"
                onClick={() => adicionar(imovel.id)}
              >
                {imovel.titulo ?? imovel.codigo}
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
