"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Check, GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  addMidiaOrigem,
  deleteMidiaOrigem,
  editMidiaOrigem,
  reorderMidiasOrigem,
  toggleMidiaOrigem,
} from "@/lib/actions/configuracoes";
import type { MidiaOrigem } from "@/types";

interface AbaMidiasOrigemProps {
  midias: MidiaOrigem[];
}

export function AbaMidiasOrigem({ midias: initialMidias }: AbaMidiasOrigemProps) {
  const [midias, setMidias] = useState(initialMidias);
  const [novaMidia, setNovaMidia] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await addMidiaOrigem(novaMidia);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMidias((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          corretor_id: "",
          nome: novaMidia.trim(),
          ativo: true,
          ordem: prev.length,
        },
      ]);
      setNovaMidia("");
      setFeedback(result.message ?? "Mídia adicionada.");
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      const result = await toggleMidiaOrigem(id, ativo);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMidias((prev) =>
        prev.map((midia) => (midia.id === id ? { ...midia, ativo } : midia)),
      );
    });
  }

  function startEdit(midia: MidiaOrigem) {
    setEditingId(midia.id);
    setEditNome(midia.nome);
    setFeedback(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNome("");
  }

  function saveEdit(id: string) {
    const trimmed = editNome.trim();
    if (!trimmed) {
      setError("Informe o nome da mídia.");
      return;
    }

    startTransition(async () => {
      const result = await editMidiaOrigem(id, trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMidias((prev) =>
        prev.map((midia) => (midia.id === id ? { ...midia, nome: trimmed } : midia)),
      );
      setEditingId(null);
      setEditNome("");
      setFeedback(result.message ?? "Mídia atualizada.");
    });
  }

  function handleDelete(id: string) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await deleteMidiaOrigem(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMidias((prev) => prev.filter((midia) => midia.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      setFeedback(result.message ?? "Mídia excluída.");
    });
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }

    const reordered = Array.from(midias);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setMidias(reordered);

    startTransition(async () => {
      const reorderResult = await reorderMidiasOrigem(reordered.map((m) => m.id));
      if (reorderResult.error) {
        setError(reorderResult.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mídias de origem</CardTitle>
        <CardDescription>
          Canais de onde os leads podem vir. Arraste para reordenar conforme sua prioridade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="midias-origem">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="divide-y rounded-lg border"
              >
                {midias.map((midia, index) => (
                  <Draggable key={midia.id} draggableId={midia.id} index={index}>
                    {(dragProvided, snapshot) => {
                      const { style, ...draggableProps } = dragProvided.draggableProps;

                      return (
                      <li
                        ref={dragProvided.innerRef}
                        {...draggableProps}
                        style={style as CSSProperties}
                        className={cn(
                          "flex items-center justify-between gap-3 bg-background px-4 py-3",
                          snapshot.isDragging && "shadow-md",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <button
                            type="button"
                            {...dragProvided.dragHandleProps}
                            className="cursor-grab touch-none text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                            disabled={isPending || editingId === midia.id}
                            aria-label="Arrastar para reordenar"
                          >
                            <GripVertical className="size-4" />
                          </button>

                          {editingId === midia.id ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <Input
                                value={editNome}
                                onChange={(event) => setEditNome(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    saveEdit(midia.id);
                                  }
                                  if (event.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                                disabled={isPending}
                                autoFocus
                                className="h-8"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                onClick={() => saveEdit(midia.id)}
                                disabled={isPending}
                                aria-label="Salvar nome"
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                onClick={cancelEdit}
                                disabled={isPending}
                                aria-label="Cancelar edição"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate",
                                midia.ativo ? "" : "text-muted-foreground line-through",
                              )}
                            >
                              {midia.nome}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {editingId !== midia.id ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => startEdit(midia)}
                                disabled={isPending}
                                aria-label={`Editar ${midia.nome}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(midia.id)}
                                disabled={isPending}
                                aria-label={`Excluir ${midia.nome}`}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          ) : null}
                          <Switch
                            checked={midia.ativo}
                            onCheckedChange={(checked) => handleToggle(midia.id, checked)}
                            disabled={isPending}
                            aria-label={`Ativar ${midia.nome}`}
                          />
                        </div>
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

        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nova mídia de origem"
            value={novaMidia}
            onChange={(event) => setNovaMidia(event.target.value)}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !novaMidia.trim()}>
            {isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Plus className="size-4" data-icon="inline-start" />
            )}
            Adicionar
          </Button>
        </form>

        {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
