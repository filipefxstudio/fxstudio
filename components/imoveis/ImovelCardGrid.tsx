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

interface ImovelCardActionsProps {
  imovel: Imovel;
  onDeleteClick: () => void;
}

function ImovelCardActions({ imovel, onDeleteClick }: ImovelCardActionsProps) {
  const router = useRouter();

  function handleEditClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/dashboard/imoveis/${imovel.id}/editar`);
  }

  function handleDeleteClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onDeleteClick();
  }

  return (
    <div className="flex items-center gap-1">
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
  );
}

interface ImovelCardItemProps {
  imovel: Imovel;
}

function ImovelCardItem({ imovel }: ImovelCardItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const capa = getCapaUrl(imovel);
  const codigo = getImovelCodigo(imovel);
  const valor = getValorNumerico(imovel);
  const valorFormatado =
    imovel.finalidade === "venda"
      ? formatCurrency(valor)
      : `${formatCurrency(valor)}/mês`;

  return (
    <>
      <Link
        href={`/dashboard/imoveis/${imovel.id}`}
        className="group block overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <article>
          <div className="relative aspect-[4/3] bg-muted">
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
              <StatusBadge status={imovel.status} />
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

            <div
              className="flex items-center justify-between gap-2 pt-1"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <div>
                <p className="text-xl font-black text-black">{valorFormatado}</p>
                <p className="text-xs text-muted-foreground">{codigo}</p>
              </div>
              <ImovelCardActions imovel={imovel} onDeleteClick={() => setDeleteOpen(true)} />
            </div>
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

interface ImovelCardGridProps {
  imoveis: Imovel[];
}

export function ImovelCardGrid({ imoveis }: ImovelCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {imoveis.map((imovel) => (
        <ImovelCardItem key={imovel.id} imovel={imovel} />
      ))}
    </div>
  );
}
