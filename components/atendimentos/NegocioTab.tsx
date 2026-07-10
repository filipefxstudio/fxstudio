"use client";

import { format } from "date-fns";

import { formatCurrency } from "@/lib/site/format";
import type { Negocio } from "@/types";

interface NegocioTabProps {
  negocios: Negocio[];
}

export function NegocioTab({ negocios }: NegocioTabProps) {
  if (negocios.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum negócio fechado. Feche a partir de uma proposta aceita na aba Propostas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {negocios.map((negocio) => (
        <article
          key={negocio.id}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Negócio fechado</p>
              <h3 className="text-lg font-semibold text-primary">
                {negocio.imovel?.titulo ?? negocio.imovel?.codigo ?? "Imóvel"}
              </h3>
              <p className="text-2xl font-bold">{formatCurrency(Number(negocio.valor_fechamento))}</p>
              <p className="text-sm text-muted-foreground">
                Fechamento: {format(new Date(negocio.data_fechamento), "dd/MM/yyyy")}
                {negocio.forma_pagamento ? ` · ${negocio.forma_pagamento}` : ""}
              </p>
              {negocio.valor_comissao ? (
                <p className="text-sm">
                  Comissão: <span className="font-medium">{formatCurrency(Number(negocio.valor_comissao))}</span>
                  {negocio.percentual_comissao ? ` (${negocio.percentual_comissao}%)` : ""}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[280px]">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Captador</p>
                <p className="font-medium">
                  {negocio.imovel?.captador?.nome ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Vendedor / responsável</p>
                <p className="font-medium">{negocio.perfil?.nome ?? "—"}</p>
              </div>
            </div>
          </div>
          {negocio.observacoes ? (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {negocio.observacoes}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
