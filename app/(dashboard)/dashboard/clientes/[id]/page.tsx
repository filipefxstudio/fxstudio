import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notFound, redirect } from "next/navigation";

import { ClienteDetalhesClient } from "@/components/clientes/ClienteDetalhesClient";
import { TipoClienteBadge } from "@/components/clientes/TipoClienteBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClienteById,
  getImoveisByClienteId,
  getLeadsByClienteTelefone,
} from "@/lib/actions/clientes";
import { getImovelCodigo } from "@/lib/imoveis/format";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

interface ClienteDetalhePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}

export async function generateMetadata({ params }: ClienteDetalhePageProps): Promise<Metadata> {
  const { id } = await params;
  const cliente = await getClienteById(id);
  return {
    title: cliente ? `${cliente.nome} | Pessoas` : "Pessoa | FX Studio",
  };
}

export default async function ClienteDetalhePage({
  params,
  searchParams,
}: ClienteDetalhePageProps) {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const { id } = await params;
  const { editar } = await searchParams;

  const cliente = await getClienteById(id);

  if (!cliente) {
    notFound();
  }

  const [imoveis, leads] = await Promise.all([
    getImoveisByClienteId(id),
    getLeadsByClienteTelefone(cliente.telefone),
  ]);

  if (editar === "1") {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/clientes/${id}`}>← Voltar</Link>
        </Button>
        <ClienteDetalhesClient mode="edit" cliente={cliente} />
      </div>
    );
  }

  const dataCadastro = format(new Date(cliente.criado_em), "dd/MM/yyyy", { locale: ptBR });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link href="/dashboard/clientes">← Pessoas</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-primary">{cliente.nome}</h2>
              <TipoClienteBadge tipo={cliente.tipo} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Cadastrado em {dataCadastro}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clientes/${id}?editar=1`}>Editar</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Telefone:</span> {cliente.telefone}</p>
              {cliente.email ? (
                <p><span className="text-muted-foreground">E-mail:</span> {cliente.email}</p>
              ) : null}
              {cliente.cpf ? (
                <p><span className="text-muted-foreground">CPF:</span> {cliente.cpf}</p>
              ) : null}
              {cliente.profissao ? (
                <p><span className="text-muted-foreground">Profissão:</span> {cliente.profissao}</p>
              ) : null}
              {cliente.estado_civil ? (
                <p><span className="text-muted-foreground">Estado civil:</span> {cliente.estado_civil}</p>
              ) : null}
              {cliente.observacoes ? (
                <p className="pt-2 text-muted-foreground">{cliente.observacoes}</p>
              ) : null}
              {cliente.eh_construtor_investidor ? (
                <p className="font-medium text-amber-600">Construtor / investidor</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imóveis vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              {imoveis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum imóvel vinculado.</p>
              ) : (
                <ul className="space-y-2">
                  {imoveis.map((imovel) => (
                    <li key={imovel.id}>
                      <Link
                        href={`/dashboard/imoveis/${imovel.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {getImovelCodigo(imovel)} — {imovel.titulo ?? "Sem título"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {(cliente.tipo === "lead" || cliente.tipo === "ambos") ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Leads / atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum lead vinculado por telefone.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {leads.map((lead) => (
                      <li key={lead.id} className="flex items-center justify-between py-3 text-sm">
                        <span>{lead.nome ?? "Lead sem nome"} — {lead.etapa}</span>
                        <Link
                          href="/dashboard/atendimentos"
                          className="text-primary hover:underline"
                        >
                          Ver leads
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
    </div>
  );
}
