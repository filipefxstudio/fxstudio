import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { Header } from "@/components/dashboard/Header";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { getDashboardStatsBothTabs } from "@/lib/actions/dashboard";
import { DEFAULT_DIAS_ALERTA_INATIVIDADE } from "@/lib/constants/config";
import { getOnboardingItems } from "@/lib/mock/dashboard";
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

  const { venda, locacao } = await getDashboardStatsBothTabs(
    DEFAULT_DIAS_ALERTA_INATIVIDADE,
  );

  if (!venda || !locacao) {
    return (
      <>
        <Header nome={nome} />
        <div className="flex-1 p-4 md:p-6">
          <p className="text-muted-foreground">Não foi possível carregar o dashboard.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header nome={nome} />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <OnboardingBanner items={onboardingItems} siteHref={siteHref} />
        <DashboardClient statsVenda={venda} statsLocacao={locacao} />
      </div>
    </>
  );
}
