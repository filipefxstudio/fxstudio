"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ETAPA_LEAD_LABELS,
  ETAPAS_LEAD,
  FINALIDADE_BUSCA_OPTIONS,
  TEMPERATURA_LEAD_LABELS,
} from "@/lib/constants/leads";
import type { EtapaLead, MidiaOrigem, TemperaturaLead } from "@/types";

export interface LeadsFilterState {
  temperatura: TemperaturaLead | "all";
  etapa: EtapaLead | "all";
  origem: string;
  finalidade: "all" | "compra" | "locacao";
  perfilId: string;
  semInteracaoDias: number | null;
}

export const defaultLeadsFilters: LeadsFilterState = {
  temperatura: "all",
  etapa: "all",
  origem: "all",
  finalidade: "all",
  perfilId: "all",
  semInteracaoDias: null,
};

interface LeadsFiltersProps {
  filters: LeadsFilterState;
  onChange: (filters: LeadsFilterState) => void;
  midias: MidiaOrigem[];
  perfis: { id: string; nome: string }[];
  diasAlertaDefault: number;
}

export function LeadsFilters({
  filters,
  onChange,
  midias,
  perfis,
  diasAlertaDefault,
}: LeadsFiltersProps) {
  function patch(partial: Partial<LeadsFilterState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label>Temperatura</Label>
        <Select
          value={filters.temperatura}
          onValueChange={(value) =>
            patch({ temperatura: value as LeadsFilterState["temperatura"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(Object.keys(TEMPERATURA_LEAD_LABELS) as TemperaturaLead[]).map((temp) => (
              <SelectItem key={temp} value={temp}>
                {TEMPERATURA_LEAD_LABELS[temp]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Etapa</Label>
        <Select
          value={filters.etapa}
          onValueChange={(value) =>
            patch({ etapa: value as LeadsFilterState["etapa"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {ETAPAS_LEAD.map((etapa) => (
              <SelectItem key={etapa} value={etapa}>
                {ETAPA_LEAD_LABELS[etapa]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mídia de origem</Label>
        <Select
          value={filters.origem}
          onValueChange={(value) => patch({ origem: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {midias
              .filter((m) => m.ativo)
              .map((midia) => (
                <SelectItem key={midia.id} value={midia.nome}>
                  {midia.nome}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Finalidade</Label>
        <Select
          value={filters.finalidade}
          onValueChange={(value) =>
            patch({ finalidade: value as LeadsFilterState["finalidade"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {FINALIDADE_BUSCA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {perfis.length > 0 ? (
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select
            value={filters.perfilId}
            onValueChange={(value) => patch({ perfilId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {perfis.map((perfil) => (
                <SelectItem key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Sem interação há</Label>
        <Select
          value={filters.semInteracaoDias?.toString() ?? "none"}
          onValueChange={(value) =>
            patch({
              semInteracaoDias: value === "none" ? null : Number(value),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Qualquer período</SelectItem>
            <SelectItem value={String(diasAlertaDefault)}>
              +{diasAlertaDefault} dias (alerta)
            </SelectItem>
            <SelectItem value="3">+3 dias</SelectItem>
            <SelectItem value="7">+7 dias</SelectItem>
            <SelectItem value="14">+14 dias</SelectItem>
            <SelectItem value="30">+30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function countActiveLeadsFilters(filters: LeadsFilterState): number {
  let count = 0;
  if (filters.temperatura !== "all") count += 1;
  if (filters.etapa !== "all") count += 1;
  if (filters.origem !== "all") count += 1;
  if (filters.finalidade !== "all") count += 1;
  if (filters.perfilId !== "all") count += 1;
  if (filters.semInteracaoDias !== null) count += 1;
  return count;
}
