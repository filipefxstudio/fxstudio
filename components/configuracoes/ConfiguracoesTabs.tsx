"use client";

import { AbaAgente } from "@/components/configuracoes/AbaAgente";
import { AbaPerfil } from "@/components/configuracoes/AbaPerfil";
import { AbaSite } from "@/components/configuracoes/AbaSite";
import { AbaWhatsApp } from "@/components/configuracoes/AbaWhatsApp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgenteConfigPublic } from "@/lib/actions/agente-config";
import type { Corretor, PlanoAssinatura } from "@/types";

interface ConfiguracoesTabsProps {
  corretor: Corretor;
  plano: PlanoAssinatura;
  agenteConfig: AgenteConfigPublic;
}

export function ConfiguracoesTabs({
  corretor,
  plano,
  agenteConfig,
}: ConfiguracoesTabsProps) {
  return (
    <Tabs defaultValue="perfil" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
        <TabsTrigger value="site">Meu site</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="agente">Agente de IA</TabsTrigger>
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
    </Tabs>
  );
}
