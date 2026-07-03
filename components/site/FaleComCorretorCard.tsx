"use client";

import { formatCurrency, getValorExibicao } from "@/lib/site/format";
import type { Corretor, Imovel } from "@/types";

import { FormularioLeadSite } from "./FormularioLeadSite";

interface FaleComCorretorCardProps {
  corretor: Corretor;
  imovel: Imovel;
}

export function FaleComCorretorCard({ corretor, imovel }: FaleComCorretorCardProps) {
  return (
    <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:w-[320px]">
      <h2 className="text-lg font-semibold text-primary">Fale com o corretor</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {corretor.nome}
        {corretor.creci ? ` · CRECI ${corretor.creci}` : ""}
      </p>

      <div className="mt-4 space-y-2 border-b border-border pb-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold text-primary">{getValorExibicao(imovel)}</span>
        </div>
        {imovel.valor_condominio ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Condomínio</span>
            <span>{formatCurrency(imovel.valor_condominio)}</span>
          </div>
        ) : null}
        {imovel.valor_iptu ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">IPTU</span>
            <span>{formatCurrency(imovel.valor_iptu)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <FormularioLeadSite
          imovelId={imovel.id}
          submitLabel="Enviar mensagem"
          observacoesPlaceholder="Tenho interesse neste imóvel..."
          showPreferenciaContato
        />
      </div>
    </aside>
  );
}
