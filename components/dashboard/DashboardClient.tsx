"use client";

import { useEffect, useState } from "react";

import { DashboardAlertas } from "@/components/dashboard/DashboardAlertas";
import { DashboardFunil } from "@/components/dashboard/DashboardFunil";
import { DashboardGraficoImoveis } from "@/components/dashboard/DashboardGraficoImoveis";
import { DashboardGraficoOrigem } from "@/components/dashboard/DashboardGraficoOrigem";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardLeadsRecentes } from "@/components/dashboard/DashboardLeadsRecentes";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats, DashboardTab } from "@/lib/actions/dashboard";
import {
  DEFAULT_DIAS_ALERTA_INATIVIDADE,
  STORAGE_KEY_DIAS_ALERTA_INATIVIDADE,
} from "@/lib/constants/config";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface DashboardClientProps {
  statsVenda: DashboardStats;
  statsLocacao: DashboardStats;
}

export function DashboardClient({ statsVenda, statsLocacao }: DashboardClientProps) {
  const [tab, setTab] = useState<DashboardTab>("venda");
  const [diasAlerta, setDiasAlerta] = useState(DEFAULT_DIAS_ALERTA_INATIVIDADE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DIAS_ALERTA_INATIVIDADE);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setDiasAlerta(parsed);
      }
    }
  }, []);

  const stats = tab === "venda" ? statsVenda : statsLocacao;
  const finalidade = tab === "venda" ? "compra" : "locacao";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardTabs activeTab={tab} onTabChange={setTab} />
      </div>

      {stats.leadsSemInteracao > 0 ? (
        <Card className="border-[#F18F01]/40 bg-[#F18F01]/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#F18F01]" />
            <div>
              <p className="font-medium text-primary">
                {stats.leadsSemInteracao} lead{stats.leadsSemInteracao === 1 ? "" : "s"} sem
                interação há mais de {diasAlerta} dias
              </p>
              <Link
                href={`/dashboard/leads?sem_interacao=${diasAlerta}&finalidade=${finalidade}`}
                className="mt-1 inline-block text-sm font-medium text-secondary hover:underline"
              >
                Ver leads →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DashboardKPIs kpis={stats.kpis} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardLeadsRecentes leads={stats.leadsRecentes} />
        <DashboardAlertas alertas={stats.alertas} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DashboardFunil etapas={stats.funil} />
        </div>
        <DashboardGraficoImoveis items={stats.imoveisPorStatus} />
        <DashboardGraficoOrigem items={stats.origemLeads} />
      </section>
    </div>
  );
}
