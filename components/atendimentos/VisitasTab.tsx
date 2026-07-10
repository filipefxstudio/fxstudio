"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Loader2,
  MoreVertical,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createVisita,
  deleteVisita,
  editarVisita,
  gerarFichaVisitaHtml,
  updateVisita,
} from "@/lib/actions/atendimentos";
import { toast } from "@/hooks/use-toast";
import type { Imovel, Visita } from "@/types";

interface VisitasTabProps {
  leadId: string;
  visitas: Visita[];
  imoveis: Imovel[];
}

export function VisitasTab({ leadId, visitas, imoveis }: VisitasTabProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imovelId, setImovelId] = useState("");
  const [dataVisita, setDataVisita] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [parecerOpen, setParecerOpen] = useState<Visita | null>(null);
  const [parecer, setParecer] = useState("");
  const [vaiProposta, setVaiProposta] = useState("");
  const [editarOpen, setEditarOpen] = useState<Visita | null>(null);
  const [editData, setEditData] = useState("");
  const [editHora, setEditHora] = useState("");

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function agendar() {
    if (!imovelId || !dataVisita) {
      toast({ variant: "destructive", title: "Preencha imóvel e data." });
      return;
    }
    startTransition(async () => {
      const result = await createVisita(leadId, {
        imovel_id: imovelId,
        data_visita: dataVisita,
        observacoes,
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setOpen(false);
      router.refresh();
    });
  }

  function gerarFicha() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast({ variant: "destructive", title: "Selecione visitas." });
      return;
    }
    startTransition(async () => {
      const result = await gerarFichaVisitaHtml(leadId, ids);
      if (result.error || !result.html) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(result.html);
        w.document.close();
        w.print();
      }
    });
  }

  function abrirEditar(visita: Visita) {
    const d = new Date(visita.data_visita);
    setEditarOpen(visita);
    setEditData(format(d, "yyyy-MM-dd"));
    setEditHora(format(d, "HH:mm"));
  }

  function salvarEdicao() {
    if (!editarOpen) return;
    if (!editData || !editHora) {
      toast({ variant: "destructive", title: "Preencha data e hora." });
      return;
    }
    startTransition(async () => {
      const result = await editarVisita(editarOpen.id, editData, editHora);
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setEditarOpen(null);
      router.refresh();
    });
  }

  function salvarParecer() {
    if (!parecerOpen) return;
    startTransition(async () => {
      const result = await updateVisita(parecerOpen.id, {
        parecer,
        vai_gerar_proposta: vaiProposta || undefined,
        status: "realizada",
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      setParecerOpen(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-primary">Visitas</h3>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 ? (
            <Button size="sm" variant="outline" onClick={gerarFicha} disabled={isPending}>
              <Printer className="size-3.5" />
              Gerar ficha ({selectedIds.size})
            </Button>
          ) : null}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Agendar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar visita</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Imóvel</Label>
                  <Select value={imovelId} onValueChange={setImovelId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {imoveis.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.titulo ?? i.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data e hora</Label>
                  <Input type="datetime-local" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                </div>
                <Button onClick={agendar} disabled={isPending} className="w-full">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : "Agendar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {visitas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visitas.map((visita) => (
            <div
              key={visita.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(visita.id)}
                  onChange={() => toggleSelect(visita.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {visita.imovel?.titulo ?? visita.imovel?.codigo ?? "Imóvel"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline size-3.5" />
                    {format(new Date(visita.data_visita), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">Status: {visita.status}</p>
                  {visita.parecer ? (
                    <p className="mt-1 text-xs">Parecer: {visita.parecer}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setParecerOpen(visita);
                    setParecer(visita.parecer ?? "");
                    setVaiProposta(visita.vai_gerar_proposta ?? "");
                  }}
                >
                  Parecer
                </Button>
                {visita.status === "agendada" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await updateVisita(visita.id, { status: "cancelada" });
                        router.refresh();
                      })
                    }
                  >
                    Cancelar
                  </Button>
                ) : null}
                <details className="relative">
                  <summary className="inline-flex cursor-pointer list-none items-center rounded-md border border-border px-2 py-1.5 hover:bg-muted [&::-webkit-details-marker]:hidden">
                    <MoreVertical className="size-3.5" />
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 min-w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
                    {visita.status === "agendada" ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => abrirEditar(visita)}
                      >
                        Editar visita
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#E63946] hover:bg-muted"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteVisita(visita.id);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </button>
                    <Link
                      href={`/dashboard/atendimentos/${leadId}?tab=propostas`}
                      className="block px-3 py-2 text-sm hover:bg-muted"
                    >
                      Proposta
                    </Link>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editarOpen)} onOpenChange={(o) => !o && setEditarOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-data">Data</Label>
              <Input
                id="edit-data"
                type="date"
                required
                value={editData}
                onChange={(e) => setEditData(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-hora">Hora</Label>
              <Input
                id="edit-hora"
                type="time"
                required
                value={editHora}
                onChange={(e) => setEditHora(e.target.value)}
              />
            </div>
            <Button onClick={salvarEdicao} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(parecerOpen)} onOpenChange={(o) => !o && setParecerOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parecer da visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Parecer</Label>
              <Select value={parecer} onValueChange={setParecer}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vai gerar proposta?</Label>
              <Select value={vaiProposta} onValueChange={setVaiProposta}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="talvez">Talvez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={salvarParecer} disabled={isPending} className="w-full">
              Salvar e marcar realizada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
