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

interface ImovelCardItemProps {
  imovel: Imovel;
  corretorSlug: string;
  statusList: StatusImovel[];
}

function ImovelCardItem({ imovel, corretorSlug, statusList }: ImovelCardItemProps) {
  const capa = getCapaUrl(imovel);
  const codigo = getImovelCodigo(imovel);
  const valor = getValorNumerico(imovel);
  const valorFormatado =
    imovel.finalidade === "venda"
      ? formatCurrency(valor)
      : `${formatCurrency(valor)}/mês`;

  return (
    <article className="group overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/dashboard/imoveis/${imovel.id}`}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capa}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={imovel.status} statusImovel={imovel.status_imovel} />
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <p className="text-xs text-muted-foreground">
            {getTipoLabel(imovel.tipo)} • {getFinalidadeLabel(imovel.finalidade)}
          </p>

          <div>
            <p className="text-base font-bold text-foreground">{imovel.bairro ?? "—"}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatEnderecoCurto(imovel)}
            </p>
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
              {imovel.quartos}
            </span>
            {imovel.suites > 0 ? (
              <span className="inline-flex items-center gap-1">
                <BedSingle className="size-3.5" />
                {imovel.suites}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" />
              {imovel.banheiros}
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="size-3.5" />
              {imovel.vagas}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <Link href={`/dashboard/imoveis/${imovel.id}`} className="min-w-0">
          <p className="text-xl font-black text-primary">{valorFormatado}</p>
          <p className="text-xs text-muted-foreground">{codigo}</p>
        </Link>
        <ImovelAcoesDropdown
          imovel={imovel}
          corretorSlug={corretorSlug}
          statusList={statusList}
          variant="card"
        />
      </div>
    </article>
  );
}

interface ImovelCardGridProps {
  imoveis: Imovel[];
  corretorSlug: string;
  statusList: StatusImovel[];
}

export function ImovelCardGrid({ imoveis, corretorSlug, statusList }: ImovelCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {imoveis.map((imovel) => (
        <ImovelCardItem
          key={imovel.id}
          imovel={imovel}
          corretorSlug={corretorSlug}
          statusList={statusList}
        />
      ))}
    </div>
  );
}
