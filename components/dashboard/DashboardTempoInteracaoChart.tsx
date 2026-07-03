"use client";

import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import type { DashboardChartSlice } from "@/lib/actions/dashboard";

interface DashboardTempoInteracaoChartProps {
  data: DashboardChartSlice[];
}

export function DashboardTempoInteracaoChart({ data }: DashboardTempoInteracaoChartProps) {
  return <DashboardDonutChart title="Tempo sem interação" data={data} />;
}
