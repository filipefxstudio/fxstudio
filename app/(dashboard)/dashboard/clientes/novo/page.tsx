import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClienteForm } from "@/components/clientes/ClienteForm";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Novo cliente | FX Studio",
};

export default async function NovoClientePage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  return (
    <>
      <Header nome={corretor.nome} />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/clientes">← Voltar para clientes</Link>
        </Button>
        <ClienteForm mode="create" />
      </div>
    </>
  );
}
