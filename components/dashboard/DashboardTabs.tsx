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
      <TabsList>
        <TabsTrigger value="venda">Venda</TabsTrigger>
        <TabsTrigger value="locacao">Locação</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
