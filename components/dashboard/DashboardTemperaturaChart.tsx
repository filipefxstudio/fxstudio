"use client";

import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import type { DashboardChartSlice } from "@/lib/actions/dashboard";

interface DashboardTemperaturaChartProps {
  data: DashboardChartSlice[];
}

export function DashboardTemperaturaChart({ data }: DashboardTemperaturaChartProps) {
  return <DashboardDonutChart title="Temperatura dos leads" data={data} />;
}
