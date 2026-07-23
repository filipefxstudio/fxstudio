"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReactNode } from "react";

const TAB_ITEMS = [
  { id: "dados", label: "Detalhes do atendimento" },
  { id: "radar", label: "Radar de imóveis" },
  { id: "selecionados", label: "Imóveis Selecionados" },
  { id: "visitas", label: "Visitas" },
  { id: "propostas", label: "Propostas" },
  { id: "negocio", label: "Negócio fechado" },
  { id: "auditoria", label: "Auditoria" },
] as const;

export type AtendimentoTabId = (typeof TAB_ITEMS)[number]["id"];

interface AtendimentoTabsProps {
  panels: Record<AtendimentoTabId, ReactNode>;
}

export function AtendimentoTabs({ panels }: AtendimentoTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = TAB_ITEMS.find((t) => t.id === tabParam)?.id ?? "dados";

  function setTab(tab: AtendimentoTabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setTab(v as AtendimentoTabId)}>
      <div className="md:hidden">
        <Select value={activeTab} onValueChange={(v) => setTab(v as AtendimentoTabId)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a aba" />
          </SelectTrigger>
          <SelectContent>
            {TAB_ITEMS.map((tab) => (
              <SelectItem key={tab.id} value={tab.id}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsList className="hidden h-auto w-full flex-wrap justify-start gap-1 md:flex">
        {TAB_ITEMS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_ITEMS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          {panels[tab.id]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
