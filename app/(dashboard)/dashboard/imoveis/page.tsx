import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getImoveis } from "@/lib/actions/imoveis";
import { FINALIDADES_IMOVEL, STATUS_IMOVEL, TIPOS_IMOVEL } from "@/lib/constants/imoveis";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import type { Imovel } from "@/types";

export const metadata: Metadata = {
  title: "Imóveis | FX Studio",
  description: "Gerencie os imóveis do seu portfólio",
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTipoLabel(tipo: Imovel["tipo"]): string {
  return TIPOS_IMOVEL.find((item) => item.value === tipo)?.label ?? tipo;
}

function getFinalidadeLabel(finalidade: Imovel["finalidade"]): string {
  return FINALIDADES_IMOVEL.find((item) => item.value === finalidade)?.label ?? finalidade;
}

function getStatusLabel(status: Imovel["status"]): string {
  return STATUS_IMOVEL.find((item) => item.value === status)?.label ?? status;
}

function getValorExibicao(imovel: Imovel): string {
  if (imovel.finalidade === "venda") {
    return formatCurrency(imovel.valor_venda);
  }

  return `${formatCurrency(imovel.valor_locacao)}/mês`;
}

function getCapaUrl(imovel: Imovel): string | null {
  const fotos = imovel.fotos ?? [];
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);
  return ordenadas[0]?.url ?? null;
}

export default async function ImoveisPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const imoveis = await getImoveis();

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Imóveis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {imoveis.length === 0
                ? "Nenhum imóvel cadastrado ainda."
                : `${imoveis.length} imóvel${imoveis.length === 1 ? "" : "is"} no portfólio`}
            </p>
          </div>

          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/imoveis/novo">
              <Plus data-icon="inline-start" />
              Novo imóvel
            </Link>
          </Button>
        </div>

        {imoveis.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Comece seu portfólio</CardTitle>
              <CardDescription>
                Cadastre seu primeiro imóvel para exibir no site e receber leads qualificados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/imoveis/novo">
                  <Plus data-icon="inline-start" />
                  Cadastrar imóvel
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Imóvel</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Finalidade</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {imoveis.map((imovel) => {
                    const capa = getCapaUrl(imovel);

                    return (
                      <tr key={imovel.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {capa ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={capa}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {imovel.titulo ?? "Sem título"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {[imovel.bairro, imovel.cidade].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getTipoLabel(imovel.tipo)}</td>
                        <td className="px-4 py-3">{getFinalidadeLabel(imovel.finalidade)}</td>
                        <td className="px-4 py-3">{getValorExibicao(imovel)}</td>
                        <td className="px-4 py-3">{getStatusLabel(imovel.status)}</td>
                        <td className="px-4 py-3">
                          {imovel.publicado_site ? "Publicado" : "Oculto"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {imoveis.map((imovel) => {
                const capa = getCapaUrl(imovel);

                return (
                  <Card key={imovel.id}>
                    <CardContent className="flex gap-3 pt-6">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {capa ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={capa} alt="" className="size-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{imovel.titulo ?? "Sem título"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getTipoLabel(imovel.tipo)} · {getFinalidadeLabel(imovel.finalidade)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-secondary">
                          {getValorExibicao(imovel)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getStatusLabel(imovel.status)}
                          {imovel.publicado_site ? " · No site" : " · Fora do site"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
