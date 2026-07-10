"use client";

import { Loader2, Search, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";

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
import { searchClientes, type ClienteSearchResult } from "@/lib/actions/clientes";
import { formatTelefoneBr } from "@/lib/imoveis/telefone";
import { cn } from "@/lib/utils";
import type { ImovelFormValues } from "@/lib/validations/imovel";

interface ProprietarioSectionProps {
  control: Control<ImovelFormValues>;
  setValue: UseFormSetValue<ImovelFormValues>;
  clienteId: string | null | undefined;
  disabled?: boolean;
  error?: string;
}

export function ProprietarioSection({
  control,
  setValue,
  clienteId,
  disabled,
  error,
}: ProprietarioSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ClienteSearchResult[]>([]);
  const [selected, setSelected] = useState<ClienteSearchResult | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSearching, startSearch] = useTransition();

  const runSearch = useCallback(
    (query: string) => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      startSearch(async () => {
        const found = await searchClientes(query);
        setResults(found);
      });
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  function selectCliente(cliente: ClienteSearchResult) {
    if (!cliente.pode_vincular) {
      return;
    }

    setSelected(cliente);
    setValue("cliente_id", cliente.id);
    setValue("proprietario_novo", null);
    setShowNewForm(false);
    setResults([]);
    setSearchQuery("");
  }

  function clearSelection() {
    setSelected(null);
    setValue("cliente_id", null);
    setValue("proprietario_novo", null);
    setShowNewForm(false);
  }

  function openNewForm() {
    setShowNewForm(true);
    setSelected(null);
    setValue("cliente_id", null);
    setValue("proprietario_novo", {
      nome: "",
      telefone: "",
      email: "",
      tipo: "ambos",
      eh_construtor_investidor: false,
    });
  }

  return (
    <div className="space-y-4">
      {selected || clienteId ? (
        <div className="flex items-start justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="font-medium">{selected?.nome ?? "Proprietário vinculado"}</p>
            {selected?.telefone ? (
              <p className="text-sm text-muted-foreground">{selected.telefone}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            disabled={disabled}
            aria-label="Remover proprietário"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar proprietário por nome ou telefone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
              disabled={disabled}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {results.length > 0 ? (
            <ul className="divide-y rounded-lg border border-border">
              {results.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    disabled={!cliente.pode_vincular || disabled}
                    onClick={() => selectCliente(cliente)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors",
                      cliente.pode_vincular
                        ? "hover:bg-muted"
                        : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                    {cliente.aviso ? (
                      <p className="mt-1 text-xs text-amber-600">{cliente.aviso}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!showNewForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={openNewForm}
              disabled={disabled}
              className="w-full sm:w-auto"
            >
              <UserPlus className="size-4" data-icon="inline-start" />
              Cadastrar novo proprietário
            </Button>
          ) : null}
        </>
      )}

      {showNewForm ? (
        <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
          <Controller
            control={control}
            name="proprietario_novo.nome"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Nome completo"
                  disabled={disabled}
                />
              </div>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="proprietario_novo.telefone"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(formatTelefoneBr(event.target.value))
                    }
                    placeholder="(31) 99999-7020"
                    disabled={disabled}
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name="proprietario_novo.email"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="email@exemplo.com"
                    disabled={disabled}
                  />
                </div>
              )}
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de relacionamento *</Label>
            <Controller
              control={control}
              name="proprietario_novo.tipo"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2">
                    <input
                      type="radio"
                      name="proprietario_tipo"
                      checked={field.value === "proprietario"}
                      onChange={() => field.onChange("proprietario")}
                      className="mt-1"
                      disabled={disabled}
                    />
                    <span className="text-sm">
                      Atender apenas como proprietário
                      <span className="mt-0.5 block text-muted-foreground">
                        Ex.: construtor que só quer vender
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2">
                    <input
                      type="radio"
                      name="proprietario_tipo"
                      checked={field.value === "ambos"}
                      onChange={() => field.onChange("ambos")}
                      className="mt-1"
                      disabled={disabled}
                    />
                    <span className="text-sm">
                      Atender também como lead interessado
                      <span className="mt-0.5 block text-muted-foreground">
                        Aparecerá também na página de Leads
                      </span>
                    </span>
                  </label>
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="proprietario_novo.eh_construtor_investidor"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>É construtor ou investidor? *</Label>
                <Select
                  value={
                    field.value === true ? "sim" : field.value === false ? "nao" : undefined
                  }
                  onValueChange={(value) => field.onChange(value === "sim")}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNewForm(false);
              setValue("proprietario_novo", null);
            }}
            disabled={disabled}
          >
            Cancelar cadastro
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
