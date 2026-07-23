import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClienteForm } from "@/components/clientes/ClienteForm";
import { Button } from "@/components/ui/button";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Nova pessoa | Deskimob",
};

export default async function NovoClientePage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/clientes">← Voltar para pessoas</Link>
      </Button>
      <ClienteForm mode="create" />
    </div>
  );
}
