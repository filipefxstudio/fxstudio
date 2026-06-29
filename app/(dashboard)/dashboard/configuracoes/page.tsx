import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfiguracoesTabs } from "@/components/configuracoes/ConfiguracoesTabs";
import { Header } from "@/components/dashboard/Header";
import { getAgenteConfig } from "@/lib/actions/agente-config";
import { getCorretorForUser } from "@/lib/supabase/get-corretor";
import { createClient } from "@/lib/supabase/server";
import type { Assinatura, PlanoAssinatura } from "@/types";

export const metadata: Metadata = {
  title: "Configurações | FX Studio",
  description: "Configure perfil, site, WhatsApp e agente de IA",
};

function obterPlanoAtivo(assinaturas: Assinatura[] | undefined): PlanoAssinatura {
  const ativa = assinaturas?.find((item) => item.status === "ativo");
  return ativa?.plano ?? "basico";
}

export default async function ConfiguracoesPage() {
  const corretor = await getCorretorForUser();

  if (!corretor) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: assinaturas } = await supabase
    .from("assinaturas")
    .select("*")
    .eq("corretor_id", corretor.id);

  const plano = obterPlanoAtivo(assinaturas ?? undefined);
  const agenteConfigResult = await getAgenteConfig(corretor.id);

  if ("error" in agenteConfigResult) {
    redirect("/dashboard");
  }

  return (
    <>
      <Header nome={corretor.nome} />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">Configurações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seu perfil, site, integrações e agente de IA.
          </p>
        </div>

        <ConfiguracoesTabs
          corretor={corretor}
          plano={plano}
          agenteConfig={agenteConfigResult}
        />
      </div>
    </>
  );
}
