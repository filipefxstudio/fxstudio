import { Building2, CalendarDays, Flame, Snowflake, Sun, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKPIItem } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

const iconMap = {
  leads: Building2,
  novos: Users,
  quentes: Flame,
  mornos: Sun,
  frios: Snowflake,
  visitas: CalendarDays,
} as const;

const accentMap = {
  leads: "bg-primary/10 text-primary",
  novos: "bg-secondary/10 text-secondary",
  quentes: "bg-[#E63946]/15 text-[#E63946]",
  mornos: "bg-[#F18F01]/15 text-[#F18F01]",
  frios: "bg-[#2E86AB]/15 text-[#2E86AB]",
  visitas: "bg-[#2DC653]/15 text-[#2DC653]",
} as const;

interface DashboardKPICardProps {
  kpi: DashboardKPIItem;
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
