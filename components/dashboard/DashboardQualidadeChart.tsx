"use client";

import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import type { DashboardChartSlice } from "@/lib/actions/dashboard";

interface DashboardQualidadeChartProps {
  data: DashboardChartSlice[];
}

export function DashboardQualidadeChart({ data }: DashboardQualidadeChartProps) {
  return <DashboardDonutChart title="Qualidade dos leads" data={data} />;
}
