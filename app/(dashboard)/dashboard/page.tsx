import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { getDashboardDataBothTabs } from "@/lib/actions/dashboard";
import { getOnboardingItems } from "@/lib/mock/dashboard";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";

export const metadata: Metadata = {
  title: "Dashboard | FX Studio",
  description: "Painel do corretor FX Studio",
};

const INITIAL_PERIOD = {
  preset: "mes" as const,
  customStart: "",
  customEnd: "",
};

export default async function DashboardPage() {
  const corretor = await getCorretorForUser();

  const nome = corretor?.nome ?? "Corretor";
  const perfilCompleto = Boolean(corretor?.telefone && corretor?.creci);
  const onboardingItems = getOnboardingItems({ perfilCompleto });
  const siteHref = corretor?.slug ? `/${corretor.slug}` : undefined;

  const { venda, locacao } = await getDashboardDataBothTabs({
    periodPreset: INITIAL_PERIOD.preset,
  });

  if (!venda || !locacao) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <DashboardGreeting nome={nome} />
        <p className="text-muted-foreground">Não foi possível carregar o dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <DashboardGreeting nome={nome} />
      <OnboardingBanner items={onboardingItems} siteHref={siteHref} />
      <DashboardClient
        statsVenda={venda}
        statsLocacao={locacao}
        initialPeriod={INITIAL_PERIOD}
      />
    </div>
  );
}
