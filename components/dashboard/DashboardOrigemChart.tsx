"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardBarItem } from "@/lib/actions/dashboard";

interface DashboardOrigemChartProps {
  items: DashboardBarItem[];
}

export function DashboardOrigemChart({ items }: DashboardOrigemChartProps) {
  const router = useRouter();
  const chartData = items.map((item) => ({ ...item, name: item.label }));

  return (
    <Card className="h-full border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Origem dos leads</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem leads no período.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), "Leads"]}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive
                  cursor="pointer"
                  onClick={(data) => {
                    const payload = data as { payload?: DashboardBarItem };
                    if (payload.payload?.href) {
                      router.push(payload.payload.href);
                    }
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
