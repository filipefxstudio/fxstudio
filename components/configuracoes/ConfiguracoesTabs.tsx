"use client";

import { AbaAtendimentosConfig } from "@/components/configuracoes/AbaAtendimentosConfig";
import { AbaEquipe } from "@/components/configuracoes/AbaEquipe";
import { AbaImoveisConfig } from "@/components/configuracoes/AbaImoveisConfig";
import { AbaPerfil } from "@/components/configuracoes/AbaPerfil";
import { AbaSite } from "@/components/configuracoes/AbaSite";
import { AbaWhatsApp } from "@/components/configuracoes/AbaWhatsApp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgenteConfigPublic } from "@/lib/actions/agente-config";
import type {
  AtendimentoConfig,
  Corretor,
  DashboardConfig,
  MarcaDaguaConfig,
  MidiaOrigem,
  MotivoDesativacao,
  MotivoDescarte,
  Perfil,
  PlanoAssinatura,
  StatusImovel,
  TipoImovelCustom,
} from "@/types";

interface ConfiguracoesTabsProps {
  corretor: Corretor;
  plano: PlanoAssinatura;
  agenteConfig: AgenteConfigPublic;
  tiposImovel: TipoImovelCustom[];
  midiasOrigem: MidiaOrigem[];
  perfisEquipe: Perfil[];
  statusImovel: StatusImovel[];
  marcaDaguaConfig: MarcaDaguaConfig | null;
  dashboardConfig: DashboardConfig;
  atendimentoConfig: AtendimentoConfig | null;
  motivosDescarte: MotivoDescarte[];
  motivosDesativacao: MotivoDesativacao[];
  initialTab?: string;
}

export function ConfiguracoesTabs({
  corretor,
  plano,
  agenteConfig,
  tiposImovel,
  midiasOrigem,
  perfisEquipe,
  statusImovel,
  marcaDaguaConfig,
  dashboardConfig,
  atendimentoConfig,
  motivosDescarte,
  motivosDesativacao,
  initialTab = "perfil",
}: ConfiguracoesTabsProps) {
  const tabValues = [
    "perfil",
    "whatsapp",
    "imoveis",
    "atendimentos",
    "equipe",
    "site",
  ] as const;
  const defaultTab = tabValues.includes(initialTab as (typeof tabValues)[number])
    ? initialTab
    : "perfil";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
        <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
        <TabsTrigger value="equipe">Equipe</TabsTrigger>
        <TabsTrigger value="site">Meu site</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <AbaPerfil corretor={corretor} />
      </TabsContent>

      <TabsContent value="whatsapp">
        <AbaWhatsApp corretor={corretor} plano={plano} agenteConfig={agenteConfig} />
      </TabsContent>

      <TabsContent value="imoveis">
        <AbaImoveisConfig
          tiposImovel={tiposImovel}
          statusImovel={statusImovel}
          marcaDaguaConfig={marcaDaguaConfig}
          atendimentoConfig={atendimentoConfig}
          motivosDesativacao={motivosDesativacao}
        />
      </TabsContent>

      <TabsContent value="atendimentos">
        <AbaAtendimentosConfig
          midiasOrigem={midiasOrigem}
          initialConfig={atendimentoConfig}
          initialMotivos={motivosDescarte}
          dashboardConfig={dashboardConfig}
        />
      </TabsContent>

      <TabsContent value="equipe">
        <AbaEquipe perfis={perfisEquipe} />
      </TabsContent>

      <TabsContent value="site">
        <AbaSite corretor={corretor} />
      </TabsContent>
    </Tabs>
  );
}
