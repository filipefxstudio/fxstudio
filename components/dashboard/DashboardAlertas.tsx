import Link from "next/link";
import { AlertTriangle, Camera, Clock, KeyRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAlertaItem } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

interface DashboardAlertasProps {
  alertas: DashboardAlertaItem[];
}

const iconMap = {
  warning: AlertTriangle,
  info: Camera,
  danger: Clock,
} as const;

const styleMap = {
  warning: "text-[#F18F01] bg-[#F18F01]/10",
  info: "text-secondary bg-secondary/10",
  danger: "text-[#E63946] bg-[#E63946]/10",
} as const;

export function DashboardAlertas({ alertas }: DashboardAlertasProps) {
  return (
    <Card className="h-full border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
        ) : (
          alertas.map((alerta) => {
            const Icon =
              alerta.id === "sem-chaves"
                ? KeyRound
                : iconMap[alerta.tipo];

            return (
              <div
                key={alerta.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    styleMap[alerta.tipo],
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">{alerta.mensagem}</p>
                  <Link
                    href={alerta.href}
                    className="mt-1 inline-block text-sm font-medium text-secondary hover:underline"
                  >
                    [{alerta.acaoLabel}]
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
