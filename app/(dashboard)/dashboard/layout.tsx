import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const corretor = await getCorretorForUser();
  const nome = corretor?.nome ?? user.email?.split("@")[0] ?? "Corretor";
  const slug = corretor?.slug ?? "";

  return (
    <DashboardShell nome={nome} slug={slug}>
      {children}
    </DashboardShell>
  );
}
