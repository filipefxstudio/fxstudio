"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardTab } from "@/lib/actions/dashboard";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as DashboardTab)}
    >
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-visible sm:w-auto sm:overflow-visible">
        <TabsTrigger value="venda" className="flex-1 sm:flex-none">
          Venda
        </TabsTrigger>
        <TabsTrigger value="locacao" className="flex-1 sm:flex-none">
          Locação
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
