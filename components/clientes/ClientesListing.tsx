"use client";

import Link from "next/link";
import { LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { ClienteCard } from "@/components/clientes/ClienteCard";
import {
  ClientesFilters,
  defaultClientesFilters,
  type ClientesFilterState,
} from "@/components/clientes/ClientesFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { contemNormalizado } from "@/lib/utils/normalizar";
import type { Cliente, Perfil } from "@/types";

type ViewMode = "grid" | "list";

interface ClientesListingProps {
  clientes: Cliente[];
  perfis: Perfil[];
}

function matchesSearch(cliente: Cliente, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const digits = query.replace(/\D/g, "");
  const telefoneDigits = cliente.telefone.replace(/\D/g, "");

  return (
    contemNormalizado(cliente.nome, query) ||
    contemNormalizado(cliente.telefone, query) ||
    (digits.length > 0 && telefoneDigits.includes(digits)) ||
    contemNormalizado(cliente.email, query)
  );
}

function matchesFilters(cliente: Cliente, filters: ClientesFilterState): boolean {
  if (filters.tipo !== "all" && cliente.tipo !== filters.tipo) {
    return false;
  }

  if (filters.construtor === "sim" && !cliente.eh_construtor_investidor) {
    return false;
  }

  if (filters.construtor === "nao" && cliente.eh_construtor_investidor) {
    return false;
  }

  if (filters.perfilId !== "all" && cliente.perfil_id !== filters.perfilId) {
    return false;
  }

  return true;
}

export function ClientesListing({ clientes, perfis }: ClientesListingProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ClientesFilterState>(defaultClientesFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = useMemo(
    () =>
      clientes.filter(
        (cliente) => matchesSearch(cliente, search) && matchesFilters(cliente, filters),
      ),
    [clientes, search, filters],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Pessoas</h2>
          <p className="text-sm text-muted-foreground">
            {clientes.length} {clientes.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clientes/novo">
            <Plus className="size-4" data-icon="inline-start" />
            Nova pessoa
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="size-4" data-icon="inline-start" />
            Filtros
          </Button>
          <Button
            type="button"
            variant={viewMode === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="Visualização em lista"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {showFilters ? (
        <Card>
          <CardContent className="pt-6">
            <ClientesFilters filters={filters} perfis={perfis} onChange={setFilters} />
          </CardContent>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma pessoa encontrada.
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "flex flex-col gap-3",
          )}
        >
          {filtered.map((cliente) => (
            <ClienteCard key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}
    </div>
  );
}
