"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bath,
  BedDouble,
  BedSingle,
  Car,
  Check,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Ruler,
} from "lucide-react";

import { ImovelAuditoriaTab } from "@/components/imoveis/ImovelAuditoriaTab";
import { ImovelAcoesDropdown } from "@/components/imoveis/ImovelAcoesDropdown";
import { ImovelDesempenhoTab } from "@/components/imoveis/ImovelDesempenhoTab";
import { ImovelGaleriaDetalhes } from "@/components/imoveis/ImovelGaleriaDetalhes";
import { StatusBadge } from "@/components/imoveis/StatusBadge";
import { ImovelMapa } from "@/components/site/ImovelMapa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { labelStatusAprovacao } from "@/lib/imoveis/aprovacao";
import { getImovelCodigo } from "@/lib/imoveis/format";
import { getPublicImovelShareUrlClient } from "@/lib/imoveis/share-url";
import { buildTelLinkLocal, buildWhatsAppLink } from "@/lib/imoveis/telefone";
import {
  formatCurrency,
  formatEndereco,
  getFinalidadeLabel,
  getTipoLabel,
  getValorExibicao,
} from "@/lib/site/format";
import type { AuditoriaImovel, Imovel, ImovelDesempenho, StatusImovel } from "@/types";

interface ImovelDetalhesProps {
  imovel: Imovel;
  corretorSlug: string;
  statusList: StatusImovel[];
  auditoria: AuditoriaImovel[];
  desempenho: ImovelDesempenho | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

const INFO_ADICIONAL_FIELDS: {
  key: keyof Imovel;
  label: string;
}[] = [
  { key: "aceita_financiamento", label: "Aceita financiamento" },
  { key: "aceita_permuta", label: "Aceita permuta" },
  { key: "exclusividade", label: "Exclusividade" },
  { key: "imovel_na_planta", label: "Imóvel na planta" },
  { key: "imovel_ocupado", label: "Imóvel ocupado" },
  { key: "contrato_aluguel_ativo", label: "Contrato de aluguel ativo" },
];

export function ImovelDetalhes({
  imovel: initialImovel,
  corretorSlug,
  statusList,
  auditoria,
  desempenho,
}: ImovelDetalhesProps) {
  const [imovel, setImovel] = useState(initialImovel);

  const titulo = imovel.titulo ?? "Sem título";
  const codigo = getImovelCodigo(imovel);
  const endereco = formatEndereco(imovel);
  const fotos = imovel.fotos ?? [];
  const diferenciais = imovel.diferenciais ?? [];
  const hasMap = imovel.latitude != null && imovel.longitude != null;
  const cliente = imovel.cliente;
  const captador = imovel.captador;
  const cadastradoPor = imovel.cadastrado_por;
  const telLink = buildTelLinkLocal(cliente?.telefone);
  const waLink = buildWhatsAppLink(cliente?.telefone);
  const shareUrl = imovel.slug
    ? getPublicImovelShareUrlClient(corretorSlug, imovel.slug)
    : null;

  const infoAdicional = INFO_ADICIONAL_FIELDS.filter(
    (field) => imovel[field.key] === true,
  );

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
          {imovel.status_aprovacao ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Aprovação: {labelStatusAprovacao(imovel.status_aprovacao)}
            </p>
          ) : null}
        </div>

        <ImovelAcoesDropdown
          imovel={imovel}
          corretorSlug={corretorSlug}
          statusList={statusList}
          variant="header"
          onValidarAtualizacao={(data) =>
            setImovel((prev) => ({ ...prev, data_ultima_atualizacao: data }))
          }
          onStatusChange={(statusId) => {
            const status = statusList.find((item) => item.id === statusId);
            setImovel((prev) => ({
              ...prev,
              status_imovel_id: statusId,
              status_imovel: status ?? prev.status_imovel,
            }));
          }}
        />
      </div>

      <ImovelGaleriaDetalhes fotos={fotos} titulo={titulo} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={imovel.status} statusImovel={imovel.status_imovel} />
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
            <BedSingle className="size-4" />
            {imovel.suites} suítes
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
          {imovel.area_total ? (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-4" />
              {imovel.area_total} m² total
            </span>
          ) : null}
        </div>

        <p className="text-2xl font-black text-primary">{getValorExibicao(imovel)}</p>

        {shareUrl ? (
          <p className="text-xs text-muted-foreground break-all">
            Link público: {shareUrl}
          </p>
        ) : null}
      </div>

      <Tabs defaultValue="detalhes">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-6 pt-4">
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
                    {imovel.status_imovel?.nome ?? imovel.status}
                  </dd>
                </div>
                {imovel.comissao_percent != null ? (
                  <div className="flex justify-between gap-4 border-b border-border pb-2 sm:block">
                    <dt className="text-muted-foreground">Comissão</dt>
                    <dd className="font-medium">{imovel.comissao_percent}%</dd>
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

          {infoAdicional.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Informações adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {infoAdicional.map((field) => (
                    <li key={field.key} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-secondary" />
                      {field.label}
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
              <CardTitle>Publicação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Site: {imovel.publicado_site ? "Sim" : "Não"} | Portais:{" "}
                {imovel.publicado_portais ? "Sim" : "Não"}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Proprietário</CardTitle>
              </CardHeader>
              <CardContent>
                {cliente ? (
                  <div className="space-y-3">
                    <p className="font-medium">{cliente.nome}</p>
                    <div className="flex flex-wrap gap-2">
                      {telLink ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={telLink}>
                            <Phone data-icon="inline-start" />
                            Ligar
                          </a>
                        </Button>
                      ) : null}
                      {waLink ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={waLink} target="_blank" rel="noopener noreferrer">
                            <MessageCircle data-icon="inline-start" />
                            WhatsApp
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Proprietário não cadastrado.{" "}
                    <Link
                      href={`/dashboard/imoveis/${imovel.id}/editar`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Cadastrar na edição
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Captador</CardTitle>
              </CardHeader>
              <CardContent>
                {captador ? (
                  <div>
                    <p className="font-medium">{captador.nome}</p>
                    {captador.email ? (
                      <p className="text-sm text-muted-foreground">{captador.email}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Captador não informado.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cadastrado por</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Captador</dt>
                  <dd className="font-medium">{captador?.nome ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cadastrado por</dt>
                  <dd className="font-medium">{cadastradoPor?.nome ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cadastrado em</dt>
                  <dd className="font-medium">{formatDate(imovel.criado_em)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ativado em</dt>
                  <dd className="font-medium">{formatDate(imovel.data_ativacao)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última atualização</dt>
                  <dd className="font-medium">{formatDate(imovel.data_ultima_atualizacao)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Desativado em</dt>
                  <dd className="font-medium">{formatDate(imovel.data_desativacao)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desempenho" className="pt-4">
          {desempenho ? (
            <ImovelDesempenhoTab desempenho={desempenho} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o desempenho deste imóvel.
            </p>
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="pt-4">
          <ImovelAuditoriaTab registros={auditoria} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
