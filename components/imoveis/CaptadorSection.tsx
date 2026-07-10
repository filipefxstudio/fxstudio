"use client";

import { Controller, type Control } from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ImovelFormValues } from "@/lib/validations/imovel";
import type { Perfil } from "@/types";

interface CaptadorSectionProps {
  control: Control<ImovelFormValues>;
  perfis: Perfil[];
  disabled?: boolean;
  error?: string;
}

export function CaptadorSection({
  control,
  perfis,
  disabled,
  error,
}: CaptadorSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Captador *</Label>
      <Controller
        control={control}
        name="captador_id"
        render={({ field }) => (
          <Select value={field.value || undefined} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger aria-invalid={Boolean(error)}>
              <SelectValue placeholder="Selecione o captador" />
            </SelectTrigger>
            <SelectContent>
              {perfis.map((perfil) => (
                <SelectItem key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
