"use client";

import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import type { DashboardChartSlice } from "@/lib/actions/dashboard";

interface DashboardImoveisDesatualizadosChartProps {
  data: DashboardChartSlice[];
}

export function DashboardImoveisDesatualizadosChart({
  data,
}: DashboardImoveisDesatualizadosChartProps) {
  return <DashboardDonutChart title="Imóveis desatualizados" data={data} />;
}
