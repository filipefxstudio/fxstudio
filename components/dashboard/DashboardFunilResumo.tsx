import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunilEtapa } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

interface DashboardFunilResumoProps {
  etapas: FunilEtapa[];
}

const stageColors = [
  "bg-primary",
  "bg-primary/85",
  "bg-secondary",
  "bg-secondary/85",
  "bg-accent",
  "bg-accent/85",
] as const;

export function DashboardFunilResumo({ etapas }: DashboardFunilResumoProps) {
  const maxCount = Math.max(...etapas.map((etapa) => etapa.count));

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Funil resumido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[640px] items-end justify-between gap-1">
            {etapas.map((etapa, index) => {
              const heightPercent = maxCount > 0 ? (etapa.count / maxCount) * 100 : 0;

              return (
                <div key={etapa.etapa} className="flex flex-1 items-end">
                  <Link
                    href={`/dashboard/leads?etapa=${etapa.etapa}`}
                    className="group flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-lg font-bold tabular-nums text-primary transition-colors group-hover:text-secondary">
                      {etapa.count}
                    </span>
                    <div className="flex h-28 w-full items-end justify-center rounded-t-lg bg-muted/50 px-1">
                      <div
                        className={cn(
                          "w-full max-w-14 rounded-t-md transition-all group-hover:opacity-90",
                          stageColors[index],
                        )}
                        style={{ height: `${Math.max(heightPercent, 12)}%` }}
                      />
                    </div>
                    <span className="text-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                      {etapa.label}
                    </span>
                  </Link>
                  {index < etapas.length - 1 ? (
                    <ChevronRight
                      className="mb-8 size-4 shrink-0 text-muted-foreground/40"
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
