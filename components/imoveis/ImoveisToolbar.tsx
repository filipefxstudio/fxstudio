"use client";

import { Filter, LayoutGrid, List, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ImoveisViewMode = "grid" | "list";

interface ImoveisToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  viewMode: ImoveisViewMode;
  onViewModeChange: (mode: ImoveisViewMode) => void;
}

export function ImoveisToolbar({
  search,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  viewMode,
  onViewModeChange,
}: ImoveisToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por código, bairro, rua ou título..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
          aria-label="Buscar imóveis"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={filtersOpen ? "secondary" : "outline"}
          onClick={onToggleFilters}
          className="flex-1 sm:flex-none"
        >
          <Filter data-icon="inline-start" />
          Filtros
          {activeFilterCount > 0 ? (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>

        <div className="flex rounded-lg border border-border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onViewModeChange("grid")}
            className={cn(viewMode === "grid" && "bg-muted")}
            aria-label="Visualização em grade"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onViewModeChange("list")}
            className={cn(viewMode === "list" && "bg-muted")}
            aria-label="Visualização em lista"
            aria-pressed={viewMode === "list"}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
