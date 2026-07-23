"use client";

import { Plus, Trash2 } from "lucide-react";
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
import type { CaptadorFormItem, ImovelFormValues } from "@/lib/validations/imovel";
import type { Perfil } from "@/types";

const EXTERNO_VALUE = "__externo__";

interface CaptadorSectionProps {
  control: Control<ImovelFormValues>;
  setValue: UseFormSetValue<ImovelFormValues>;
  captadores: CaptadorFormItem[];
  perfis: Perfil[];
  disabled?: boolean;
  error?: string;
}

function createCaptadorInterno(perfilId: string, principal: boolean): CaptadorFormItem {
  return {
    id: crypto.randomUUID(),
    perfil_id: perfilId,
    nome_externo: null,
    principal,
    externo: false,
  };
}

function createCaptadorExterno(principal: boolean): CaptadorFormItem {
  return {
    id: crypto.randomUUID(),
    perfil_id: null,
    nome_externo: "",
    principal,
    externo: true,
  };
}

export function CaptadorSection({
  control,
  setValue,
  captadores,
  perfis,
  disabled,
  error,
}: CaptadorSectionProps) {
  function updateCaptadores(next: CaptadorFormItem[]) {
    const normalized =
      next.length === 1
        ? next.map((item) => ({ ...item, principal: true }))
        : next.some((item) => item.principal)
          ? next
          : next.map((item, index) => ({ ...item, principal: index === 0 }));

    setValue("captadores", normalized, { shouldValidate: true });
    const principal = normalized.find((item) => item.principal) ?? normalized[0];
    setValue(
      "captador_id",
      principal?.externo ? "" : principal?.perfil_id ?? "",
      { shouldValidate: true },
    );
  }

  function addCaptador() {
    const principal = captadores.length === 0;
    const defaultPerfil = perfis[0];

    if (!defaultPerfil) {
      updateCaptadores([...captadores, createCaptadorExterno(principal)]);
      return;
    }

    updateCaptadores([...captadores, createCaptadorInterno(defaultPerfil.id, principal)]);
  }

  function removeCaptador(id: string) {
    updateCaptadores(captadores.filter((item) => item.id !== id));
  }

  function setPrincipal(id: string) {
    updateCaptadores(
      captadores.map((item) => ({
        ...item,
        principal: item.id === id,
      })),
    );
  }

  function updateCaptador(id: string, patch: Partial<CaptadorFormItem>) {
    updateCaptadores(
      captadores.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="space-y-3">
      <Label>Captador *</Label>

      {captadores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Adicione ao menos um captador responsável pelo imóvel.
        </p>
      ) : null}

      <ul className="space-y-3">
        {captadores.map((captador) => (
          <li key={captador.id} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              {captadores.length > 1 ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="captador_principal"
                    checked={captador.principal}
                    onChange={() => setPrincipal(captador.id)}
                    disabled={disabled}
                  />
                  Principal
                </label>
              ) : (
                <span className="text-sm text-muted-foreground">Captador principal</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeCaptador(captador.id)}
                disabled={disabled || captadores.length <= 1}
                aria-label="Remover captador"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Selecione</Label>
              <Select
                value={captador.externo ? EXTERNO_VALUE : captador.perfil_id ?? undefined}
                onValueChange={(value) => {
                  if (value === EXTERNO_VALUE) {
                    updateCaptador(captador.id, {
                      externo: true,
                      perfil_id: null,
                      nome_externo: captador.nome_externo ?? "",
                    });
                    return;
                  }

                  updateCaptador(captador.id, {
                    externo: false,
                    perfil_id: value,
                    nome_externo: null,
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o captador" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.nome}
                    </SelectItem>
                  ))}
                  <SelectItem value={EXTERNO_VALUE}>Corretor parceiro externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {captador.externo ? (
              <div className="space-y-2">
                <Label htmlFor={`captador-externo-${captador.id}`}>Nome do parceiro *</Label>
                <Input
                  id={`captador-externo-${captador.id}`}
                  value={captador.nome_externo ?? ""}
                  onChange={(event) =>
                    updateCaptador(captador.id, { nome_externo: event.target.value })
                  }
                  disabled={disabled}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCaptador}
        disabled={disabled}
      >
        <Plus className="size-4" data-icon="inline-start" />
        Captador
      </Button>

      <Controller control={control} name="captadores" render={() => <></>} />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
