import Link from "next/link";
import { Bot, Flame, Snowflake, Sun } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardLeadRecenteItem } from "@/lib/actions/dashboard";
import type { TemperaturaLead } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardLeadsRecentesProps {
  leads: DashboardLeadRecenteItem[];
}

function TemperaturaIcon({ temperatura }: { temperatura: TemperaturaLead }) {
  if (temperatura === "quente") {
    return <Flame className="size-4 text-[#E63946]" aria-label="Quente" />;
  }

  if (temperatura === "morno") {
    return <Sun className="size-4 text-[#F18F01]" aria-label="Morno" />;
  }

  return <Snowflake className="size-4 text-[#2E86AB]" aria-label="Frio" />;
}

export function DashboardLeadsRecentes({ leads }: DashboardLeadsRecentesProps) {
  return (
    <Card className="h-full border-border/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Leads recentes</CardTitle>
        <Link
          href="/dashboard/leads"
          className="text-sm font-medium text-secondary hover:underline"
        >
          Ver todos →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lead recente.</p>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="block rounded-lg border border-border/70 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-primary">{lead.nome}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {lead.origem}
                    </span>
                    {lead.atendido_por === "agente_ia" ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                        )}
                        title="Atendido por agente IA"
                      >
                        <Bot className="size-3" />
                        IA
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.interesseImovel}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <TemperaturaIcon temperatura={lead.temperatura} />
                  <span className="text-xs text-muted-foreground">{lead.tempoAtras}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
