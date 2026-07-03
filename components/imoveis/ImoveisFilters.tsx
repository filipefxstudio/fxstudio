"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARACTERISTICAS_CHECKLIST } from "@/lib/constants/caracteristicas-checklist";
import { FINALIDADES_IMOVEL, TIPOS_IMOVEL } from "@/lib/constants/imoveis";
import { cn } from "@/lib/utils";
import type { FinalidadeImovel, StatusImovel, TipoImovel } from "@/types";

type MinimoNumericoFilter = "all" | "1" | "2" | "3" | "4";

export interface ImoveisFilterState {
  finalidade: FinalidadeImovel | "all";
  tipo: TipoImovel | "all";
  statusId: string | "all";
  valorMin: string;
  valorMax: string;
  bairro: string;
  quartosMin: MinimoNumericoFilter;
  banheirosMin: MinimoNumericoFilter;
  vagasMin: MinimoNumericoFilter;
  caracteristicas: string[];
}

export const defaultImoveisFilters: ImoveisFilterState = {
  finalidade: "all",
  tipo: "all",
  statusId: "all",
  valorMin: "",
  valorMax: "",
  bairro: "",
  quartosMin: "all",
  banheirosMin: "all",
  vagasMin: "all",
  caracteristicas: [],
};

const MINIMO_OPCOES: { value: MinimoNumericoFilter; label: string }[] = [
  { value: "all", label: "Qualquer" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

interface ImoveisFiltersProps {
  filters: ImoveisFilterState;
  onChange: (filters: ImoveisFilterState) => void;
  bairros: string[];
  statusList: StatusImovel[];
}

export function ImoveisFilters({
  filters,
  onChange,
  bairros,
  statusList,
}: ImoveisFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function update<K extends keyof ImoveisFilterState>(key: K, value: ImoveisFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleCaracteristica(item: string, checked: boolean) {
    const next = checked
      ? [...filters.caracteristicas, item]
      : filters.caracteristicas.filter((value) => value !== item);
    update("caracteristicas", next);
  }

  function handleClear() {
    onChange(defaultImoveisFilters);
    setAdvancedOpen(false);
  }

  const hasActiveFilters =
    filters.finalidade !== "all" ||
    filters.tipo !== "all" ||
    filters.statusId !== "all" ||
    filters.valorMin !== "" ||
    filters.valorMax !== "" ||
    filters.bairro !== "" ||
    filters.quartosMin !== "all" ||
    filters.banheirosMin !== "all" ||
    filters.vagasMin !== "all" ||
    filters.caracteristicas.length > 0;

  return (
    <div
      id="imoveis-filters-panel"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Filtros</h3>
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <X className="size-4" data-icon="inline-start" />
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Finalidade</Label>
          <Select
            value={filters.finalidade}
            onValueChange={(value) =>
              update("finalidade", value as ImoveisFilterState["finalidade"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {FINALIDADES_IMOVEL.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.tipo}
            onValueChange={(value) => update("tipo", value as ImoveisFilterState["tipo"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_IMOVEL.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.statusId}
            onValueChange={(value) => update("statusId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusList.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-valor-min">Valor mínimo (R$)</Label>
          <Input
            id="filtro-valor-min"
            type="number"
            min={0}
            placeholder="0"
            value={filters.valorMin}
            onChange={(event) => update("valorMin", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-valor-max">Valor máximo (R$)</Label>
          <Input
            id="filtro-valor-max"
            type="number"
            min={0}
            placeholder="Sem limite"
            value={filters.valorMax}
            onChange={(event) => update("valorMax", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Bairro</Label>
          <Select
            value={filters.bairro || "all"}
            onValueChange={(value) => update("bairro", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os bairros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {bairros.map((bairro) => (
                <SelectItem key={bairro} value={bairro}>
                  {bairro}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quartos (mínimo)</Label>
          <Select
            value={filters.quartosMin}
            onValueChange={(value) =>
              update("quartosMin", value as ImoveisFilterState["quartosMin"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              {MINIMO_OPCOES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Banheiros (mínimo)</Label>
          <Select
            value={filters.banheirosMin}
            onValueChange={(value) =>
              update("banheirosMin", value as ImoveisFilterState["banheirosMin"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              {MINIMO_OPCOES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vagas (mínimo)</Label>
          <Select
            value={filters.vagasMin}
            onValueChange={(value) =>
              update("vagasMin", value as ImoveisFilterState["vagasMin"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              {MINIMO_OPCOES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="gap-1"
        >
          {advancedOpen ? "Ocultar filtros avançados" : "Exibir mais filtros"}
          <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
        </Button>
      </div>

      {advancedOpen ? (
        <div className="mt-4 space-y-6 border-t border-border pt-4">
          {CARACTERISTICAS_CHECKLIST.map((categoria) => (
            <div key={categoria.id} className="space-y-3">
              <h4 className="text-sm font-medium text-primary">{categoria.titulo}</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categoria.itens.map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={filters.caracteristicas.includes(item)}
                      onCheckedChange={(checked) =>
                        toggleCaracteristica(item, checked === true)
                      }
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function countActiveFilters(filters: ImoveisFilterState): number {
  let count = 0;
  if (filters.finalidade !== "all") count += 1;
  if (filters.tipo !== "all") count += 1;
  if (filters.statusId !== "all") count += 1;
  if (filters.valorMin) count += 1;
  if (filters.valorMax) count += 1;
  if (filters.bairro) count += 1;
  if (filters.quartosMin !== "all") count += 1;
  if (filters.banheirosMin !== "all") count += 1;
  if (filters.vagasMin !== "all") count += 1;
  if (filters.caracteristicas.length > 0) count += filters.caracteristicas.length;
  return count;
}
