"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus } from "lucide-react";

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
import { createVisita, updateVisita } from "@/lib/actions/atendimentos";
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
  const [imovelId, setImovelId] = useState("");
  const [dataVisita, setDataVisita] = useState("");
  const [observacoes, setObservacoes] = useState("");

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

  function marcarRealizada(visitaId: string) {
    startTransition(async () => {
      const result = await updateVisita(visitaId, { status: "realizada" });
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Visitas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Agendar visita
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
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
                <Label htmlFor="data_visita">Data e hora</Label>
                <Input
                  id="data_visita"
                  type="datetime-local"
                  value={dataVisita}
                  onChange={(e) => setDataVisita(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="obs_visita">Observações</Label>
                <Textarea
                  id="obs_visita"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <Button onClick={agendar} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Agendar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {visitas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
      ) : (
        <ul className="space-y-3">
          {visitas.map((visita) => (
            <li
              key={visita.id}
              className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {visita.imovel?.titulo ?? visita.imovel?.codigo ?? "Imóvel"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(visita.data_visita), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  {" · "}
                  {visita.status}
                </p>
              </div>
              {visita.status === "agendada" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => marcarRealizada(visita.id)}
                >
                  Marcar realizada
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
