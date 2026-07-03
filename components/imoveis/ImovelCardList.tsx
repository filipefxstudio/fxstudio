"use client";

import Link from "next/link";
import {
  Bath,
  BedDouble,
  BedSingle,
  Car,
  Maximize2,
} from "lucide-react";

import { ImovelAcoesDropdown } from "@/components/imoveis/ImovelAcoesDropdown";
import { StatusBadge } from "@/components/imoveis/StatusBadge";
import {
  formatCurrency,
  formatEnderecoCurto,
  getImovelCodigo,
  getValorNumerico,
} from "@/lib/imoveis/format";
import {
  getCapaUrl,
  getFinalidadeLabel,
  getTipoLabel,
} from "@/lib/site/format";
import type { Imovel, StatusImovel } from "@/types";

interface ImovelListItemProps {
  imovel: Imovel;
  corretorSlug: string;
  statusList: StatusImovel[];
}

function ImovelListItem({ imovel, corretorSlug, statusList }: ImovelListItemProps) {
  const capa = getCapaUrl(imovel);
  const codigo = getImovelCodigo(imovel);
  const valor = getValorNumerico(imovel);
  const valorFormatado =
    imovel.finalidade === "venda"
      ? formatCurrency(valor)
      : `${formatCurrency(valor)}/mês`;

  return (
    <article className="group overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link
          href={`/dashboard/imoveis/${imovel.id}`}
          className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center"
        >
        <div className="relative size-full shrink-0 overflow-hidden rounded-lg bg-muted sm:size-32">
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capa}
              alt=""
              className="aspect-[4/3] size-full object-cover sm:aspect-square"
            />
          ) : (
            <div className="flex aspect-[4/3] size-full items-center justify-center text-sm text-muted-foreground sm:aspect-square">
              Sem foto
            </div>
          )}
          <div className="absolute left-2 top-2 sm:hidden">
            <StatusBadge status={imovel.status} statusImovel={imovel.status_imovel} />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {getTipoLabel(imovel.tipo)} • {getFinalidadeLabel(imovel.finalidade)}
                </p>
                <span className="hidden sm:inline">
                  <StatusBadge status={imovel.status} statusImovel={imovel.status_imovel} />
                </span>
              </div>
              <p className="mt-1 text-base font-bold text-foreground">{imovel.bairro ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{formatEnderecoCurto(imovel)}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary">{valorFormatado}</p>
              <p className="text-xs text-muted-foreground">{codigo}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {imovel.area_util ? (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" />
                {imovel.area_util} m²
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {imovel.quartos} quartos
            </span>
            {imovel.suites > 0 ? (
              <span className="inline-flex items-center gap-1">
                <BedSingle className="size-3.5" />
                {imovel.suites} suítes
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" />
              {imovel.banheiros} banh.
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="size-3.5" />
              {imovel.vagas} vagas
            </span>
          </div>
        </div>
        </Link>

        <div className="flex shrink-0 items-center sm:flex-col">
          <ImovelAcoesDropdown
            imovel={imovel}
            corretorSlug={corretorSlug}
            statusList={statusList}
            variant="card"
          />
        </div>
      </div>
    </article>
  );
}

interface ImovelCardListProps {
  imoveis: Imovel[];
  corretorSlug: string;
  statusList: StatusImovel[];
}

export function ImovelCardList({ imoveis, corretorSlug, statusList }: ImovelCardListProps) {
  return (
    <div className="space-y-4">
      {imoveis.map((imovel) => (
        <ImovelListItem
          key={imovel.id}
          imovel={imovel}
          corretorSlug={corretorSlug}
          statusList={statusList}
        />
      ))}
    </div>
  );
}
