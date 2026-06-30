"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { ImovelCardGrid } from "@/components/imoveis/ImovelCardGrid";
import { ImovelCardList } from "@/components/imoveis/ImovelCardList";
import {
  defaultImoveisFilters,
  ImoveisFilters,
  type ImoveisFilterState,
} from "@/components/imoveis/ImoveisFilters";
import {
  ImoveisToolbar,
  type ImoveisViewMode,
} from "@/components/imoveis/ImoveisToolbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getImovelCodigo, getValorNumerico } from "@/lib/imoveis/format";
import type { Imovel } from "@/types";

const VIEW_MODE_STORAGE_KEY = "fxstudio-imoveis-view";

interface ImoveisListingProps {
  imoveis: Imovel[];
}

function countActiveFilters(filters: ImoveisFilterState): number {
  let count = 0;
  if (filters.finalidade !== "all") count += 1;
  if (filters.tipo !== "all") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.valorMin) count += 1;
  if (filters.valorMax) count += 1;
  if (filters.bairro) count += 1;
  if (filters.quartosMin !== "all") count += 1;
  if (filters.banheirosMin !== "all") count += 1;
  if (filters.vagasMin !== "all") count += 1;
  return count;
}

function matchesMinimo(
  valor: number | null | undefined,
  minimo: ImoveisFilterState["quartosMin"],
): boolean {
  if (minimo === "all") {
    return true;
  }

  const min = Number(minimo);
  return (valor ?? 0) >= min;
}

function matchesSearch(imovel: Imovel, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();
  const codigo = getImovelCodigo(imovel).toLowerCase();
  const codigoRaw = imovel.codigo?.toLowerCase() ?? "";

  return (
    codigo.includes(normalized) ||
    codigoRaw.includes(normalized) ||
    (imovel.bairro?.toLowerCase().includes(normalized) ?? false) ||
    (imovel.logradouro?.toLowerCase().includes(normalized) ?? false) ||
    (imovel.titulo?.toLowerCase().includes(normalized) ?? false)
  );
}

function matchesFilters(imovel: Imovel, filters: ImoveisFilterState): boolean {
  if (filters.finalidade !== "all" && imovel.finalidade !== filters.finalidade) {
    return false;
  }

  if (filters.tipo !== "all" && imovel.tipo !== filters.tipo) {
    return false;
  }

  if (filters.status !== "all" && imovel.status !== filters.status) {
    return false;
  }

  if (filters.bairro && imovel.bairro?.toLowerCase() !== filters.bairro.toLowerCase()) {
    return false;
  }

  const valor = getValorNumerico(imovel);

  if (filters.valorMin) {
    const min = Number(filters.valorMin);
    if (valor === null || valor < min) {
      return false;
    }
  }

  if (filters.valorMax) {
    const max = Number(filters.valorMax);
    if (valor === null || valor > max) {
      return false;
    }
  }

  if (!matchesMinimo(imovel.quartos, filters.quartosMin)) {
    return false;
  }

  if (!matchesMinimo(imovel.banheiros, filters.banheirosMin)) {
    return false;
  }

  if (!matchesMinimo(imovel.vagas, filters.vagasMin)) {
    return false;
  }

  return true;
}

export function ImoveisListing({ imoveis }: ImoveisListingProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ImoveisFilterState>(defaultImoveisFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ImoveisViewMode>("grid");

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setViewMode(stored);
    }
  }, []);

  function handleViewModeChange(mode: ImoveisViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }

  const bairros = useMemo(() => {
    const unique = new Set<string>();
    for (const imovel of imoveis) {
      if (imovel.bairro) {
        unique.add(imovel.bairro);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [imoveis]);

  const filteredImoveis = useMemo(
    () =>
      imoveis.filter(
        (imovel) => matchesSearch(imovel, search) && matchesFilters(imovel, filters),
      ),
    [imoveis, search, filters],
  );

  const activeFilterCount = countActiveFilters(filters);

  if (imoveis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comece seu portfólio</CardTitle>
          <CardDescription>
            Cadastre seu primeiro imóvel para exibir no site e receber leads qualificados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/imoveis/novo">
              <Plus data-icon="inline-start" />
              Cadastrar imóvel
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Imóveis</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {imoveis.length} imóvel{imoveis.length === 1 ? "" : "is"} no portfólio
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/imoveis/novo">
            <Plus data-icon="inline-start" />
            Novo imóvel
          </Link>
        </Button>
      </div>

      <ImoveisToolbar
        search={search}
        onSearchChange={setSearch}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        activeFilterCount={activeFilterCount}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <ImoveisFilters
        open={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        bairros={bairros}
      />

      {filteredImoveis.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum imóvel encontrado com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <ImovelCardGrid imoveis={filteredImoveis} />
      ) : (
        <ImovelCardList imoveis={filteredImoveis} />
      )}
    </div>
  );
}
