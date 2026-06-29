import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ImovelForm } from "@/components/imoveis/ImovelForm";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Novo imóvel | FX Studio",
  description: "Cadastre um novo imóvel no portfólio",
};

export default async function NovoImovelPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
              <Link href="/dashboard/imoveis">
                <ArrowLeft data-icon="inline-start" />
                Voltar para imóveis
              </Link>
            </Button>
            <h2 className="text-lg font-semibold text-primary">Novo imóvel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preencha as informações para cadastrar um imóvel no seu portfólio.
            </p>
          </div>
        </div>

        <ImovelForm />
      </div>
    </>
  );
}
