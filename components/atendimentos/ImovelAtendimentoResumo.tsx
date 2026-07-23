import type { ReactNode } from "react";

import { ImovelPhotoBadge } from "@/components/atendimentos/ImovelPhotoBadge";
import { getImovelCodigo } from "@/lib/imoveis/format";
import type { ImovelWorkflowBadgeVariant } from "@/lib/atendimentos/badges";
import { getCapaUrl, getTipoLabel, getValorExibicao } from "@/lib/site/format";
import type { Imovel } from "@/types";

function formatEnderecoCompleto(imovel: Imovel): string {
  const partes = [
    imovel.logradouro,
    imovel.numero,
    imovel.complemento,
    imovel.bairro,
    imovel.cidade,
  ].filter(Boolean);

  return partes.join(", ") || "Endereço não informado";
}

interface ImovelAtendimentoResumoProps {
  imovel: Imovel;
  className?: string;
  badgeVariant?: ImovelWorkflowBadgeVariant | null;
  photoBadge?: ReactNode;
}

export function ImovelAtendimentoResumo({
  imovel,
  className,
  badgeVariant,
  photoBadge,
}: ImovelAtendimentoResumoProps) {
  const capa = getCapaUrl(imovel);

  return (
    <div className={className ?? "flex min-w-0 flex-1 flex-col gap-3 sm:flex-row"}>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Sem foto
          </div>
        )}
        {photoBadge ?? (badgeVariant ? (
          <div className="absolute right-2 top-2">
            <ImovelPhotoBadge variant={badgeVariant} />
          </div>
        ) : null)}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{getImovelCodigo(imovel)}</p>
        <p className="text-sm text-muted-foreground">{getTipoLabel(imovel.tipo)}</p>
        <p className="text-sm">{formatEnderecoCompleto(imovel)}</p>
        <p className="text-sm font-medium">{getValorExibicao(imovel)}</p>
      </div>
    </div>
  );
}
