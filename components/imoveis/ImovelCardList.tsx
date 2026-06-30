"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bath,
  BedDouble,
  BedSingle,
  Car,
  Maximize2,
  Pencil,
  Trash2,
} from "lucide-react";

import { DeleteImovelDialog } from "@/components/imoveis/DeleteImovelDialog";
import { StatusBadge } from "@/components/imoveis/StatusBadge";
import { Button } from "@/components/ui/button";
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
import type { Imovel } from "@/types";

interface ImovelListItemProps {
  imovel: Imovel;
}

function ImovelListItem({ imovel }: ImovelListItemProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const capa = getCapaUrl(imovel);
  const codigo = getImovelCodigo(imovel);
  const valor = getValorNumerico(imovel);
  const valorFormatado =
    imovel.finalidade === "venda"
      ? formatCurrency(valor)
      : `${formatCurrency(valor)}/mês`;

  function handleEditClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/dashboard/imoveis/${imovel.id}/editar`);
  }

  function handleDeleteClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDeleteOpen(true);
  }

  return (
    <>
      <Link
        href={`/dashboard/imoveis/${imovel.id}`}
        className="group block overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <article className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
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
              <StatusBadge status={imovel.status} />
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
                    <StatusBadge status={imovel.status} />
                  </span>
                </div>
                <p className="mt-1 text-base font-bold text-foreground">{imovel.bairro ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{formatEnderecoCurto(imovel)}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-black">{valorFormatado}</p>
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

          <div
            className="flex shrink-0 items-center gap-1 sm:flex-col"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleEditClick}
              aria-label="Editar imóvel"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteClick}
              aria-label="Excluir imóvel"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </article>
      </Link>

      <DeleteImovelDialog
        imovelId={imovel.id}
        imovelTitulo={imovel.titulo ?? codigo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

interface ImovelCardListProps {
  imoveis: Imovel[];
}

export function ImovelCardList({ imoveis }: ImovelCardListProps) {
  return (
    <div className="space-y-4">
      {imoveis.map((imovel) => (
        <ImovelListItem key={imovel.id} imovel={imovel} />
      ))}
    </div>
  );
}
