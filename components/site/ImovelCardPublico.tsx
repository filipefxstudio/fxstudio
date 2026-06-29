"use client";

import Link from "next/link";
import { Bath, BedDouble, Car, Maximize2 } from "lucide-react";

import {
  getCapaUrl,
  getFinalidadeLabel,
  getTipoLabel,
  getValorExibicao,
} from "@/lib/site/format";
import type { Imovel } from "@/types";

import { useSite } from "./SiteProvider";

interface ImovelCardPublicoProps {
  imovel: Imovel;
}

export function ImovelCardPublico({ imovel }: ImovelCardPublicoProps) {
  const { link } = useSite();
  const capa = getCapaUrl(imovel);
  const href = link(`/imoveis/${imovel.slug ?? imovel.id}`);

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capa}
              alt={imovel.titulo ?? "Imóvel"}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Sem foto
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            {getFinalidadeLabel(imovel.finalidade)}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {getTipoLabel(imovel.tipo)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[#2D3748]">
              {imovel.titulo ?? "Imóvel disponível"}
            </h3>
            {imovel.bairro || imovel.cidade ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {[imovel.bairro, imovel.cidade].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>

          <p className="text-lg font-bold text-primary">{getValorExibicao(imovel)}</p>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {imovel.quartos > 0 ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {imovel.quartos} quartos
              </span>
            ) : null}
            {imovel.banheiros > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Bath className="size-3.5" />
                {imovel.banheiros} banh.
              </span>
            ) : null}
            {imovel.vagas > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Car className="size-3.5" />
                {imovel.vagas} vagas
              </span>
            ) : null}
            {imovel.area_util ? (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" />
                {imovel.area_util} m²
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
