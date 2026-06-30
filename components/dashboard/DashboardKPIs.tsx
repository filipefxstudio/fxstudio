import Link from "next/link";
import { Flame, Snowflake, Sun, UserPlus, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKPIItem } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

const iconMap = {
  leads: Users,
  novos: UserPlus,
  quentes: Flame,
  mornos: Sun,
  frios: Snowflake,
} as const;

const accentMap = {
  leads: "bg-primary/10 text-primary",
  novos: "bg-secondary/10 text-secondary",
  quentes: "bg-[#E63946]/15 text-[#E63946]",
  mornos: "bg-[#F18F01]/15 text-[#F18F01]",
  frios: "bg-[#2E86AB]/15 text-[#2E86AB]",
} as const;

interface DashboardKPIsProps {
  kpis: DashboardKPIItem[];
}

export function DashboardKPIs({ kpis }: DashboardKPIsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon];
        const content = (
          <Card className="border-border/80 transition-shadow hover:shadow-sm">
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

        return kpi.href ? (
          <Link key={kpi.id} href={kpi.href} className="block">
            {content}
          </Link>
        ) : (
          <div key={kpi.id}>{content}</div>
        );
      })}
    </section>
  );
}
