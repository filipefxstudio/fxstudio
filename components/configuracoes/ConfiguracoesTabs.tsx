"use client";

import { AbaAgente } from "@/components/configuracoes/AbaAgente";
import { AbaEquipe } from "@/components/configuracoes/AbaEquipe";
import { AbaFunil } from "@/components/configuracoes/AbaFunil";
import { AbaMidiasOrigem } from "@/components/configuracoes/AbaMidiasOrigem";
import { AbaPerfil } from "@/components/configuracoes/AbaPerfil";
import { AbaSite } from "@/components/configuracoes/AbaSite";
import { AbaTiposImovel } from "@/components/configuracoes/AbaTiposImovel";
import { AbaWhatsApp } from "@/components/configuracoes/AbaWhatsApp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgenteConfigPublic } from "@/lib/actions/agente-config";
import type { Corretor, MidiaOrigem, Perfil, PlanoAssinatura, TipoImovelCustom } from "@/types";

interface ConfiguracoesTabsProps {
  corretor: Corretor;
  plano: PlanoAssinatura;
  agenteConfig: AgenteConfigPublic;
  tiposImovel: TipoImovelCustom[];
  midiasOrigem: MidiaOrigem[];
  perfisEquipe: Perfil[];
}

export function ConfiguracoesTabs({
  corretor,
  plano,
  agenteConfig,
  tiposImovel,
  midiasOrigem,
  perfisEquipe,
}: ConfiguracoesTabsProps) {
  return (
    <Tabs defaultValue="perfil" className="w-full">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
        <TabsTrigger value="site">Meu site</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="agente">Agente de IA</TabsTrigger>
        <TabsTrigger value="tipos">Tipos de imóvel</TabsTrigger>
        <TabsTrigger value="midias">Mídias de origem</TabsTrigger>
        <TabsTrigger value="equipe">Equipe</TabsTrigger>
        <TabsTrigger value="funil">Funil</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <AbaPerfil corretor={corretor} />
      </TabsContent>

      <TabsContent value="site">
        <AbaSite corretor={corretor} />
      </TabsContent>

      <TabsContent value="whatsapp">
        <AbaWhatsApp corretor={corretor} />
      </TabsContent>

      <TabsContent value="agente">
        <AbaAgente plano={plano} initialConfig={agenteConfig} />
      </TabsContent>

      <TabsContent value="tipos">
        <AbaTiposImovel tipos={tiposImovel} />
      </TabsContent>

      <TabsContent value="midias">
        <AbaMidiasOrigem midias={midiasOrigem} />
      </TabsContent>

      <TabsContent value="equipe">
        <AbaEquipe perfis={perfisEquipe} />
      </TabsContent>

      <TabsContent value="funil">
        <AbaFunil />
      </TabsContent>
    </Tabs>
  );
}
