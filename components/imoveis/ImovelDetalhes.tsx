"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bath,
  BedDouble,
  Car,
  Check,
  MapPin,
  Maximize2,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import { DeleteImovelDialog } from "@/components/imoveis/DeleteImovelDialog";
import { ImovelGaleriaDetalhes } from "@/components/imoveis/ImovelGaleriaDetalhes";
import { StatusBadge } from "@/components/imoveis/StatusBadge";
import { ImovelMapa } from "@/components/site/ImovelMapa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updatePublicadoSite } from "@/lib/actions/imoveis";
import { getImovelCodigo, getPublicImovelUrl } from "@/lib/imoveis/format";
import {
  formatCurrency,
  formatEndereco,
  getFinalidadeLabel,
  getTipoLabel,
  getValorExibicao,
} from "@/lib/site/format";
import { STATUS_IMOVEL } from "@/lib/constants/imoveis";
import type { Imovel } from "@/types";

interface ImovelDetalhesProps {
  imovel: Imovel;
  corretorSlug: string;
}

export function ImovelDetalhes({ imovel, corretorSlug }: ImovelDetalhesProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publicadoSite, setPublicadoSite] = useState(imovel.publicado_site);
  const [isPending, startTransition] = useTransition();

  const titulo = imovel.titulo ?? "Sem título";
  const codigo = getImovelCodigo(imovel);
  const endereco = formatEndereco(imovel);
  const fotos = imovel.fotos ?? [];
  const diferenciais = imovel.diferenciais ?? [];
  const hasMap = imovel.latitude != null && imovel.longitude != null;

  function handleShare() {
    if (!imovel.slug) {
      toast({
        variant: "destructive",
        title: "Link indisponível",
        description: "Este imóvel ainda não possui slug para compartilhamento.",
      });
      return;
    }

    const url = getPublicImovelUrl(corretorSlug, imovel.slug);

    void navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado",
        description: "O link público do imóvel foi copiado para a área de transferência.",
      });
    });
  }

  function handlePublicadoSiteChange(checked: boolean) {
    setPublicadoSite(checked);

    startTransition(async () => {
      const result = await updatePublicadoSite(imovel.id, checked);

      if (result.error) {
        setPublicadoSite(!checked);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: result.error,
        });
        return;
      }

      toast({
        title: checked ? "Publicado no site" : "Removido do site",
        description: checked
          ? "O imóvel agora está visível na vitrine pública."
          : "O imóvel foi ocultado da vitrine pública.",
      });

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/dashboard/imoveis" className="hover:text-primary">
          Imóveis
        </Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">Detalhes</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{codigo}</p>
          <h2 className="text-xl font-semibold text-primary md:text-2xl">{titulo}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 data-icon="inline-start" />
            Compartilhar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/imoveis/${imovel.id}/editar`}>
              <Pencil data-icon="inline-start" />
              Editar
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 data-icon="inline-start" />
            Excluir
          </Button>
        </div>
      </div>

      <ImovelGaleriaDetalhes fotos={fotos} titulo={titulo} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={imovel.status} />
          <span className="text-sm text-muted-foreground">
            {getFinalidadeLabel(imovel.finalidade)} • {getTipoLabel(imovel.tipo)}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>{endereco || "Endereço não informado"}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="size-4" />
            {imovel.quartos} quartos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="size-4" />
            {imovel.banheiros} banheiros
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Car className="size-4" />
            {imovel.vagas} vagas
          </span>
          {imovel.area_util ? (
            <span className="inline-flex items-center gap-1.5">
              <Maximize2 className="size-4" />
              {imovel.area_util} m² útil
            </span>
          ) : null}
          {imovel.suites ? (
            <span>{imovel.suites} suítes</span>
          ) : null}
        </div>

        <p className="text-2xl font-black text-black">{getValorExibicao(imovel)}</p>
      </div>

      {imovel.descricao ? (
        <Card>
          <CardHeader>
            <CardTitle>Sobre o imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {imovel.descricao}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-medium">{codigo}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
              <dt className="text-muted-foreground">Finalidade</dt>
              <dd className="font-medium">{getFinalidadeLabel(imovel.finalidade)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium">{getTipoLabel(imovel.tipo)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {STATUS_IMOVEL.find((item) => item.value === imovel.status)?.label ??
                  imovel.status}
              </dd>
            </div>
            {imovel.finalidade === "venda" ? (
              <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
                <dt className="text-muted-foreground">Valor de venda</dt>
                <dd className="font-medium">{formatCurrency(imovel.valor_venda)}</dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
                <dt className="text-muted-foreground">Valor de locação</dt>
                <dd className="font-medium">{formatCurrency(imovel.valor_locacao)}/mês</dd>
              </div>
            )}
            {imovel.valor_condominio ? (
              <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
                <dt className="text-muted-foreground">Condomínio</dt>
                <dd className="font-medium">{formatCurrency(imovel.valor_condominio)}</dd>
              </div>
            ) : null}
            {imovel.valor_iptu ? (
              <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
                <dt className="text-muted-foreground">IPTU</dt>
                <dd className="font-medium">{formatCurrency(imovel.valor_iptu)}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {diferenciais.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {diferenciais.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {hasMap ? (
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <ImovelMapa
              latitude={imovel.latitude as number}
              longitude={imovel.longitude as number}
              endereco={endereco}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Publicação nos portais</CardTitle>
          <CardDescription>Gerencie onde este imóvel está visível.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <div>
              <Label htmlFor="publicado-site" className="text-sm font-medium">
                Site do corretor
              </Label>
              <p className="text-xs text-muted-foreground">
                Exibir na vitrine pública do seu site
              </p>
            </div>
            <Switch
              id="publicado-site"
              checked={publicadoSite}
              onCheckedChange={handlePublicadoSiteChange}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border px-4 py-3 opacity-60">
            <div>
              <p className="text-sm font-medium">ZAP Imóveis</p>
              <p className="text-xs text-muted-foreground">Integração em breve</p>
            </div>
            <Switch disabled checked={false} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border px-4 py-3 opacity-60">
            <div>
              <p className="text-sm font-medium">Viva Real</p>
              <p className="text-xs text-muted-foreground">Integração em breve</p>
            </div>
            <Switch disabled checked={false} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proprietário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Não cadastrado</p>
        </CardContent>
      </Card>

      <DeleteImovelDialog
        imovelId={imovel.id}
        imovelTitulo={titulo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
