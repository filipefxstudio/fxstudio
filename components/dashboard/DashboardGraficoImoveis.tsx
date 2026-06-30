import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardBarItem } from "@/lib/actions/dashboard";

interface DashboardGraficoImoveisProps {
  items: DashboardBarItem[];
  title?: string;
}

export function DashboardGraficoImoveis({
  items,
  title = "Portfólio de imóveis",
}: DashboardGraficoImoveisProps) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <Card className="h-full border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(width, item.count > 0 ? 6 : 0)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
