import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FunilKanban } from "@/components/dashboard/FunilKanban";
import { Header } from "@/components/dashboard/Header";
import { getLeads } from "@/lib/actions/leads";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Leads | FX Studio",
  description: "Funil de leads do corretor",
};

export default async function LeadsPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const leads = await getLeads();

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 p-4 md:p-6">
        <FunilKanban initialLeads={leads} corretorId={corretor.id} />
      </div>
    </>
  );
}
