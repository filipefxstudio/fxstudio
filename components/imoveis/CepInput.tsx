"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export interface CepAddressData {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CepInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressFound: (address: CepAddressData) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CepInput({
  id = "cep",
  value,
  onChange,
  onAddressFound,
  error,
  disabled,
  className,
  showLabel = true,
}: CepInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const lookupCep = useCallback(
    async (rawCep: string) => {
      const digits = rawCep.replace(/\D/g, "");

      if (digits.length !== 8) {
        return;
      }

      setIsLoading(true);
      setLookupError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

        if (!response.ok) {
          setLookupError("Não foi possível consultar o CEP.");
          return;
        }

        const data = (await response.json()) as ViaCepResponse;

        if (data.erro) {
          setLookupError("CEP não encontrado.");
          return;
        }

        onAddressFound({
          logradouro: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
        });
      } catch {
        setLookupError("Erro ao buscar CEP. Verifique sua conexão.");
      } finally {
        setIsLoading(false);
      }
    },
    [onAddressFound],
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCep(event.target.value);
    onChange(formatted);
    setLookupError(null);
  }

  function handleBlur() {
    void lookupCep(value);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel ? <Label htmlFor={id}>CEP</Label> : null}
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          placeholder="00000-000"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isLoading}
          aria-invalid={Boolean(error || lookupError)}
          maxLength={9}
        />
        {isLoading ? (
          <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {lookupError ? (
        <p className="text-sm text-destructive" role="alert">
          {lookupError}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
