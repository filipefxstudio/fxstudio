import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardFunilItem } from "@/lib/actions/dashboard";

interface DashboardFunilProps {
  etapas: DashboardFunilItem[];
}

export function DashboardFunil({ etapas }: DashboardFunilProps) {
  const maxCount = Math.max(...etapas.map((e) => e.count), 1);

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Funil de vendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {etapas.map((etapa) => {
          const width = maxCount > 0 ? (etapa.count / maxCount) * 100 : 0;

          return (
            <Link
              key={etapa.id}
              href={etapa.href}
              className="group block space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary group-hover:text-secondary">
                  {etapa.label}
                </span>
                <span className="tabular-nums font-bold text-primary">{etapa.count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-secondary transition-all group-hover:bg-secondary/80"
                  style={{ width: `${Math.max(width, etapa.count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
