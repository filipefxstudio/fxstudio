import type { Metadata } from "next";

import { DashboardAlertas } from "@/components/dashboard/DashboardAlertas";
import { DashboardFunilResumo } from "@/components/dashboard/DashboardFunilResumo";
import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard";
import { DashboardLeadsRecentes } from "@/components/dashboard/DashboardLeadsRecentes";
import { Header } from "@/components/dashboard/Header";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import {
  dashboardAlertas,
  dashboardKPIs,
  funilEtapas,
  getOnboardingItems,
  leadsRecentes,
} from "@/lib/mock/dashboard";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Dashboard | FX Studio",
  description: "Painel do corretor FX Studio",
};

export default async function DashboardPage() {
  const corretor = await getCorretorForUser();

  const nome = corretor?.nome ?? "Corretor";
  const perfilCompleto = Boolean(corretor?.telefone && corretor?.creci);
  const onboardingItems = getOnboardingItems({ perfilCompleto });
  const siteHref = corretor?.slug ? `/${corretor.slug}` : undefined;

  return (
    <>
      <Header nome={nome} />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <OnboardingBanner items={onboardingItems} siteHref={siteHref} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardKPIs.map((kpi) => (
            <DashboardKPICard key={kpi.id} kpi={kpi} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardLeadsRecentes leads={leadsRecentes} />
          <DashboardAlertas alertas={dashboardAlertas} />
        </section>

        <section>
          <DashboardFunilResumo etapas={funilEtapas} />
        </section>
      </div>
    </>
  );
}
