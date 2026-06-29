"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ImovelFoto } from "@/types";

interface ImovelGaleriaProps {
  fotos: ImovelFoto[];
  titulo: string;
}

export function ImovelGaleria({ fotos, titulo }: ImovelGaleriaProps) {
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);
  const [indice, setIndice] = useState(0);

  if (ordenadas.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-muted text-muted-foreground">
        Nenhuma foto disponível
      </div>
    );
  }

  const atual = ordenadas[indice];

  function irPara(novoIndice: number) {
    const total = ordenadas.length;
    setIndice((novoIndice + total) % total);
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={atual.url}
          alt={atual.legenda ?? titulo}
          className="aspect-[16/10] w-full object-cover"
        />

        {ordenadas.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => irPara(indice - 1)}
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => irPara(indice + 1)}
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Próxima foto"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {indice + 1} / {ordenadas.length}
            </span>
          </>
        ) : null}
      </div>

      {ordenadas.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ordenadas.map((foto, fotoIndice) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setIndice(fotoIndice)}
              className={`overflow-hidden rounded-lg border-2 ${
                fotoIndice === indice ? "border-accent" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.legenda ?? `${titulo} ${fotoIndice + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
