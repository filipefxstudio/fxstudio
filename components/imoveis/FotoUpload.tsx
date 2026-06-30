"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import imageCompression from "browser-image-compression";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FotoItem {
  id: string;
  file?: File;
  existingId?: string;
  previewUrl: string;
  legenda: string;
  ordem: number;
}

interface FotoUploadProps {
  fotos: FotoItem[];
  onChange: (fotos: FotoItem[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.85,
} as const;

async function compressImageFile(file: File): Promise<File> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

  return new File([compressed], file.name, {
    type: compressed.type || file.type,
    lastModified: Date.now(),
  });
}

function reorderFotos(fotos: FotoItem[]): FotoItem[] {
  return fotos.map((foto, index) => ({ ...foto, ordem: index }));
}

function createFotoItem(file: File, ordem: number): FotoItem {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    legenda: "",
    ordem,
  };
}

export function FotoUpload({ fotos, onChange, disabled }: FotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fotosRef = useRef(fotos);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  useEffect(() => {
    return () => {
      for (const foto of fotosRef.current) {
        if (foto.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(foto.previewUrl);
        }
      }
    };
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsCompressing(true);
      setError(null);

      const nextFotos = [...fotos];
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        for (const file of Array.from(files)) {
          if (!ACCEPTED_TYPES.includes(file.type)) {
            errors.push(`${file.name}: formato não suportado.`);
            continue;
          }

          if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: arquivo maior que 10 MB.`);
            continue;
          }

          let processedFile = file;

          if (COMPRESSIBLE_TYPES.includes(file.type)) {
            try {
              processedFile = await compressImageFile(file);
            } catch {
              warnings.push(
                `${file.name}: não foi possível comprimir. Usando arquivo original.`,
              );
              processedFile = file;
            }
          }

          nextFotos.push(createFotoItem(processedFile, nextFotos.length));
        }

        const messages = [...errors, ...warnings];

        if (messages.length > 0) {
          setError(messages.join(" "));
        }

        onChange(reorderFotos(nextFotos));
      } finally {
        setIsCompressing(false);
      }
    },
    [fotos, onChange],
  );

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void addFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleRemove(id: string) {
    const removed = fotos.find((foto) => foto.id === id);

    if (removed?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(removed.previewUrl);
    }

    onChange(reorderFotos(fotos.filter((foto) => foto.id !== id)));
    setError(null);
  }

  function handleLegendaChange(id: string, legenda: string) {
    onChange(fotos.map((foto) => (foto.id === id ? { ...foto, legenda } : foto)));
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }

    const items = Array.from(fotos);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(reorderFotos(items));
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Fotos do imóvel</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie JPG, PNG ou WebP (até 10 MB cada). As fotos são comprimidas
          automaticamente antes do envio. Arraste para reordenar.
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center",
          (disabled || isCompressing) && "pointer-events-none opacity-50",
        )}
      >
        {isCompressing ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-8 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm font-medium">
          {isCompressing ? "Comprimindo fotos…" : "Adicionar fotos"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isCompressing
            ? "Aguarde enquanto otimizamos os arquivos"
            : "Clique ou arraste arquivos para esta área"}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isCompressing}
        >
          {isCompressing ? "Comprimindo…" : "Selecionar arquivos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || isCompressing}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {fotos.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fotos">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {fotos.map((foto, index) => (
                  <Draggable key={foto.id} draggableId={foto.id} index={index}>
                    {(dragProvided, snapshot) => {
                      const { style, ...draggableProps } = dragProvided.draggableProps;

                      return (
                      <li
                        ref={dragProvided.innerRef}
                        {...draggableProps}
                        style={style as CSSProperties}
                        className={cn(
                          "flex gap-3 rounded-xl border border-border bg-card p-3",
                          snapshot.isDragging && "shadow-md",
                        )}
                      >
                        <button
                          type="button"
                          className="mt-1 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                          aria-label="Reordenar foto"
                          {...dragProvided.dragHandleProps}
                          disabled={disabled}
                        >
                          <GripVertical className="size-4" />
                        </button>

                        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foto.previewUrl}
                            alt={foto.legenda || `Foto ${index + 1}`}
                            className="size-full object-cover"
                          />
                          {index === 0 ? (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/90 px-1 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                              Capa
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {foto.file?.name ?? "Foto existente"}
                          </p>
                          <Input
                            placeholder="Legenda (opcional)"
                            value={foto.legenda}
                            onChange={(event) =>
                              handleLegendaChange(foto.id, event.target.value)
                            }
                            disabled={disabled}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(foto.id)}
                          disabled={disabled}
                          aria-label="Remover foto"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      ) : null}
    </div>
  );
}
