"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

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
import { FINALIDADES_IMOVEL, TIPOS_IMOVEL } from "@/lib/constants/imoveis";
import type { FinalidadeImovel, TipoImovel } from "@/types";

import { useSite } from "./SiteProvider";

interface FiltrosBuscaProps {
  bairros?: string[];
  initialValues?: {
    tipo?: TipoImovel;
    finalidade?: FinalidadeImovel;
    bairro?: string;
    valorMin?: number;
    valorMax?: number;
  };
  layout?: "hero" | "sidebar";
}

export function FiltrosBusca({
  bairros = [],
  initialValues = {},
  layout = "sidebar",
}: FiltrosBuscaProps) {
  const router = useRouter();
  const { link } = useSite();

  const [tipo, setTipo] = useState(initialValues.tipo ?? undefined);
  const [finalidade, setFinalidade] = useState(initialValues.finalidade ?? undefined);
  const [bairro, setBairro] = useState(initialValues.bairro ?? undefined);
  const [valorMin, setValorMin] = useState(
    initialValues.valorMin ? String(initialValues.valorMin) : "",
  );
  const [valorMax, setValorMax] = useState(
    initialValues.valorMax ? String(initialValues.valorMax) : "",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (tipo) {
      params.set("tipo", tipo);
    }
    if (finalidade) {
      params.set("finalidade", finalidade);
    }
    if (bairro) {
      params.set("bairro", bairro);
    }
    if (valorMin) {
      params.set("valorMin", valorMin.replace(/\D/g, ""));
    }
    if (valorMax) {
      params.set("valorMax", valorMax.replace(/\D/g, ""));
    }

    const query = params.toString();
    router.push(`${link("/imoveis")}${query ? `?${query}` : ""}`);
  }

  const isHero = layout === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isHero
          ? "grid gap-4 rounded-2xl bg-white p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-5"
          : "space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm"
      }
    >
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          value={tipo}
          onValueChange={(value) => setTipo(value as TipoImovel)}
        >
          <SelectTrigger id="tipo">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_IMOVEL.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="finalidade">Finalidade</Label>
        <Select
          value={finalidade}
          onValueChange={(value) => setFinalidade(value as FinalidadeImovel)}
        >
          <SelectTrigger id="finalidade">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            {FINALIDADES_IMOVEL.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bairro">Bairro</Label>
        {bairros.length > 0 ? (
          <Select value={bairro} onValueChange={setBairro}>
            <SelectTrigger id="bairro">
              <SelectValue placeholder="Qualquer bairro" />
            </SelectTrigger>
            <SelectContent>
              {bairros.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="bairro"
            value={bairro}
            onChange={(event) => setBairro(event.target.value)}
            placeholder="Digite o bairro"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="valorMin">Valor mínimo</Label>
        <Input
          id="valorMin"
          inputMode="numeric"
          value={valorMin}
          onChange={(event) => setValorMin(event.target.value)}
          placeholder="R$ 0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="valorMax">Valor máximo</Label>
        <Input
          id="valorMax"
          inputMode="numeric"
          value={valorMax}
          onChange={(event) => setValorMax(event.target.value)}
          placeholder="Sem limite"
        />
      </div>

      <div className={isHero ? "sm:col-span-2 lg:col-span-5" : ""}>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
          <Search className="size-4" />
          Buscar imóveis
        </Button>
      </div>
    </form>
  );
}
