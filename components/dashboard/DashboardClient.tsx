"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { DashboardAlertas } from "@/components/dashboard/DashboardAlertas";
import { DashboardCaptacoesChart } from "@/components/dashboard/DashboardCaptacoesChart";
import { DashboardFunil } from "@/components/dashboard/DashboardFunil";
import { DashboardImoveisDesatualizadosChart } from "@/components/dashboard/DashboardImoveisDesatualizadosChart";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardOrigemChart } from "@/components/dashboard/DashboardOrigemChart";
import {
  DashboardPeriodFilter,
  type DashboardPeriodState,
} from "@/components/dashboard/DashboardPeriodFilter";
import { DashboardQualidadeChart } from "@/components/dashboard/DashboardQualidadeChart";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardTemperaturaChart } from "@/components/dashboard/DashboardTemperaturaChart";
import { DashboardTempoInteracaoChart } from "@/components/dashboard/DashboardTempoInteracaoChart";
import {
  getDashboardDataBothTabs,
  type DashboardData,
  type DashboardTab,
} from "@/lib/actions/dashboard";

interface DashboardClientProps {
  statsVenda: DashboardData;
  statsLocacao: DashboardData;
  initialPeriod: DashboardPeriodState;
}

export function DashboardClient({
  statsVenda: initialVenda,
  statsLocacao: initialLocacao,
  initialPeriod,
}: DashboardClientProps) {
  const [tab, setTab] = useState<DashboardTab>("venda");
  const [period, setPeriod] = useState<DashboardPeriodState>(initialPeriod);
  const [statsVenda, setStatsVenda] = useState(initialVenda);
  const [statsLocacao, setStatsLocacao] = useState(initialLocacao);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback((nextPeriod: DashboardPeriodState) => {
    startTransition(async () => {
      const result = await getDashboardDataBothTabs({
        periodPreset: nextPeriod.preset,
        customStart: nextPeriod.customStart || undefined,
        customEnd: nextPeriod.customEnd || undefined,
      });

      if (result.venda) setStatsVenda(result.venda);
      if (result.locacao) setStatsLocacao(result.locacao);
    });
  }, []);

  useEffect(() => {
    if (
      period.preset === initialPeriod.preset &&
      period.customStart === initialPeriod.customStart &&
      period.customEnd === initialPeriod.customEnd
    ) {
      return;
    }

    if (period.preset === "personalizado" && (!period.customStart || !period.customEnd)) {
      return;
    }

    fetchData(period);
  }, [period, initialPeriod, fetchData]);

  const stats = tab === "venda" ? statsVenda : statsLocacao;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <DashboardTabs activeTab={tab} onTabChange={setTab} />
        <DashboardPeriodFilter value={period} onChange={setPeriod} />
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Atualizando dados…
        </div>
      )}

      <DashboardKPIs kpis={stats.kpis} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardFunil etapas={stats.funil} />
        <DashboardTemperaturaChart data={stats.temperatura} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardQualidadeChart data={stats.qualidade} />
        <DashboardTempoInteracaoChart data={stats.tempoInteracao} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardOrigemChart items={stats.origem} />
        <DashboardCaptacoesChart data={stats.captacoes} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardImoveisDesatualizadosChart data={stats.imoveisDesatualizados} />
        <DashboardAlertas alertas={stats.alertas} />
      </section>
    </div>
  );
}
