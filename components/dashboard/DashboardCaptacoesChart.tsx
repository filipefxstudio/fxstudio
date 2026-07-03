"use client";

import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import type { DashboardChartSlice } from "@/lib/actions/dashboard";

interface DashboardCaptacoesChartProps {
  data: DashboardChartSlice[];
}

export function DashboardCaptacoesChart({ data }: DashboardCaptacoesChartProps) {
  const ativados = data.find((d) => d.label === "Ativados")?.value ?? 0;
  const desativados = data.find((d) => d.label === "Desativados")?.value ?? 0;
  const saldo = ativados - desativados;
  const saldoLabel = saldo >= 0 ? `+${saldo}` : String(saldo);

  return (
    <DashboardDonutChart
      title="Captações de imóveis"
      data={data}
      centerValue={saldoLabel}
      centerLabel="Saldo"
    />
  );
}
