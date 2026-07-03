"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, Loader2, Plus, Trash2 } from "lucide-react";

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
  createAgendaItem,
  deleteAgendaItem,
  updateAgendaStatus,
} from "@/lib/actions/agenda";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agenda, TipoAgenda } from "@/types";

interface AgendaPageClientProps {
  initialItems: Agenda[];
}

const TIPO_LABELS: Record<TipoAgenda, string> = {
  visita: "Visita",
  ligacao: "Ligação",
  reuniao: "Reunião",
  tarefa: "Tarefa",
  lembrete: "Lembrete",
  outro: "Outro",
};

export function AgendaPageClient({ initialItems }: AgendaPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoAgenda>("tarefa");
  const [dataAtividade, setDataAtividade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [lembreteEmail, setLembreteEmail] = useState(false);

  const hoje = new Date();
  const atividadesHoje = useMemo(
    () =>
      initialItems.filter(
        (item) =>
          item.status === "pendente" && isSameDay(new Date(item.data_atividade), hoje),
      ),
    [initialItems, hoje],
  );

  const diasDoMes = useMemo(() => {
    const inicio = startOfMonth(mesAtual);
    const fim = endOfMonth(mesAtual);
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  function criarAtividade() {
    if (!titulo.trim() || !dataAtividade) {
      toast({ variant: "destructive", title: "Preencha título e data." });
      return;
    }
    startTransition(async () => {
      const result = await createAgendaItem({
        titulo,
        tipo,
        data_atividade: dataAtividade,
        descricao,
        lembrete_email: lembreteEmail,
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

  function concluir(id: string) {
    startTransition(async () => {
      await updateAgendaStatus(id, "concluida");
      router.refresh();
    });
  }

  function excluir(id: string) {
    startTransition(async () => {
      await deleteAgendaItem(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Agenda</h2>
          <p className="text-sm text-muted-foreground">
            {atividadesHoje.length} atividade{atividadesHoje.length === 1 ? "" : "s"} pendente
            {atividadesHoje.length === 1 ? "" : "s"} hoje
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Nova atividade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ag_titulo">Título</Label>
                <Input id="ag_titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAgenda)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ag_data">Data e hora</Label>
                <Input
                  id="ag_data"
                  type="datetime-local"
                  value={dataAtividade}
                  onChange={(e) => setDataAtividade(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ag_desc">Descrição</Label>
                <Textarea
                  id="ag_desc"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lembreteEmail}
                  onChange={(e) => setLembreteEmail(e.target.checked)}
                />
                Enviar lembrete por e-mail
              </label>
              <Button onClick={criarAtividade} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <section className="rounded-xl border border-border p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
          <Calendar className="size-4" />
          Atividades de hoje
        </h3>
        {atividadesHoje.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade pendente para hoje.</p>
        ) : (
          <ul className="space-y-2">
            {atividadesHoje.map((item) => (
              <AgendaCard
                key={item.id}
                item={item}
                disabled={isPending}
                onConcluir={() => concluir(item.id)}
                onExcluir={() => excluir(item.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-primary capitalize">
            {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setMesAtual((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
              }
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setMesAtual((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
              }
            >
              Próximo
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: diasDoMes[0].getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {diasDoMes.map((dia) => {
            const count = initialItems.filter((item) =>
              isSameDay(new Date(item.data_atividade), dia),
            ).length;
            const isToday = isSameDay(dia, hoje);
            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  "min-h-14 rounded-lg border border-transparent p-1 text-left text-xs",
                  isSameMonth(dia, mesAtual) && "border-border/60",
                  isToday && "border-primary bg-primary/5",
                )}
              >
                <span className={cn("font-medium", isToday && "text-primary")}>
                  {format(dia, "d")}
                </span>
                {count > 0 ? (
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {count} ativ.
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AgendaCard({
  item,
  disabled,
  onConcluir,
  onExcluir,
}: {
  item: Agenda;
  disabled: boolean;
  onConcluir: () => void;
  onExcluir: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{item.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {TIPO_LABELS[item.tipo]} ·{" "}
          {format(new Date(item.data_atividade), "HH:mm", { locale: ptBR })}
          {item.lead?.nome ? ` · ${item.lead.nome}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={disabled} onClick={onConcluir}>
          <Check className="size-3.5" />
          Concluir
        </Button>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={onExcluir}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}
