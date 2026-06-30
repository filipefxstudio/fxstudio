"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FINALIDADES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
} from "@/lib/constants/imoveis";
import type { FinalidadeImovel, StatusImovel, TipoImovel } from "@/types";

type MinimoNumericoFilter = "all" | "1" | "2" | "3" | "4";

export interface ImoveisFilterState {
  finalidade: FinalidadeImovel | "all";
  tipo: TipoImovel | "all";
  status: StatusImovel | "all";
  valorMin: string;
  valorMax: string;
  bairro: string;
  quartosMin: MinimoNumericoFilter;
  banheirosMin: MinimoNumericoFilter;
  vagasMin: MinimoNumericoFilter;
}

export const defaultImoveisFilters: ImoveisFilterState = {
  finalidade: "all",
  tipo: "all",
  status: "all",
  valorMin: "",
  valorMax: "",
  bairro: "",
  quartosMin: "all",
  banheirosMin: "all",
  vagasMin: "all",
};

const MINIMO_OPCOES: { value: MinimoNumericoFilter; label: string }[] = [
  { value: "all", label: "Qualquer" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

interface ImoveisFiltersProps {
  open: boolean;
  filters: ImoveisFilterState;
  onChange: (filters: ImoveisFilterState) => void;
  onClose: () => void;
  bairros: string[];
}

export function ImoveisFilters({
  open,
  filters,
  onChange,
  onClose,
  bairros,
}: ImoveisFiltersProps) {
  if (!open) {
    return null;
  }

  function update<K extends keyof ImoveisFilterState>(key: K, value: ImoveisFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function handleClear() {
    onChange(defaultImoveisFilters);
  }

  const hasActiveFilters =
    filters.finalidade !== "all" ||
    filters.tipo !== "all" ||
    filters.status !== "all" ||
    filters.valorMin !== "" ||
    filters.valorMax !== "" ||
    filters.bairro !== "" ||
    filters.quartosMin !== "all" ||
    filters.banheirosMin !== "all" ||
    filters.vagasMin !== "all";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Filtros</h3>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar filtros">
          <X className="size-4" />
        </Button>
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
            value={filters.status}
            onValueChange={(value) => update("status", value as ImoveisFilterState["status"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_IMOVEL.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
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

      {hasActiveFilters ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
