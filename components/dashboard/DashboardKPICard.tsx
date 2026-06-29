import { Building2, CalendarDays, Flame, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKPI } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

const iconMap = {
  imoveis: Building2,
  leads: Users,
  quentes: Flame,
  visitas: CalendarDays,
} as const;

const accentMap = {
  imoveis: "bg-primary/10 text-primary",
  leads: "bg-secondary/10 text-secondary",
  quentes: "bg-accent/15 text-accent",
  visitas: "bg-[#2DC653]/15 text-[#2DC653]",
} as const;

interface DashboardKPICardProps {
  kpi: DashboardKPI;
}

export function DashboardKPICard({ kpi }: DashboardKPICardProps) {
  const Icon = iconMap[kpi.icon];

  return (
    <Card className="border-border/80">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            accentMap[kpi.icon],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{kpi.label}</p>
          <p className="text-2xl font-bold tabular-nums text-primary">{kpi.value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
