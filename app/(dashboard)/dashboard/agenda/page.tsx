import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AgendaPageClient } from "@/components/agenda/AgendaPageClient";
import { getAgendaItems } from "@/lib/actions/agenda";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Agenda | FX Studio",
  description: "Agenda de atividades do corretor",
};

export default async function AgendaPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const items = await getAgendaItems();

  return (
    <div className="flex-1 p-4 md:p-6">
      <AgendaPageClient initialItems={items} />
    </div>
  );
}
