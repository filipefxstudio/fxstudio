"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Perfil, TipoCliente } from "@/types";

export interface ClientesFilterState {
  tipo: TipoCliente | "all";
  construtor: "all" | "sim" | "nao";
  perfilId: string | "all";
}

export const defaultClientesFilters: ClientesFilterState = {
  tipo: "all",
  construtor: "all",
  perfilId: "all",
};

interface ClientesFiltersProps {
  filters: ClientesFilterState;
  perfis: Perfil[];
  onChange: (filters: ClientesFilterState) => void;
}

export function ClientesFilters({ filters, perfis, onChange }: ClientesFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={filters.tipo}
          onValueChange={(value) =>
            onChange({ ...filters, tipo: value as ClientesFilterState["tipo"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="proprietario">Proprietário</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Construtor / investidor</Label>
        <Select
          value={filters.construtor}
          onValueChange={(value) =>
            onChange({ ...filters, construtor: value as ClientesFilterState["construtor"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sim">Sim</SelectItem>
            <SelectItem value="nao">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {perfis.length > 0 ? (
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select
            value={filters.perfilId}
            onValueChange={(value) => onChange({ ...filters, perfilId: value })}
          >
            <SelectTrigger>
              <SelectValue />
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
    </div>
  );
}
