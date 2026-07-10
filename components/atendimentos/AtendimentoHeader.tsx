"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  MessageCircle,
  MoreVertical,
  Phone,
  Trash2,
  UserCheck,
  UserCog,
} from "lucide-react";

import { AtendimentoModals } from "@/components/atendimentos/AtendimentoModals";
import { SituacaoBadge } from "@/components/atendimentos/SituacaoBadge";
import { TemperaturaBadge } from "@/components/leads/TemperaturaBadge";
import { Button } from "@/components/ui/button";
import { ETAPA_LEAD_LABELS } from "@/lib/constants/leads";
import {
  buildTelLink,
  buildWhatsAppLink,
  formatTelefoneLead,
  formatTempoPrimeiraResposta,
} from "@/lib/leads/format";
import {
  marcarContatoFeito,
  qualificarLead,
} from "@/lib/actions/atendimentos";
import { toast } from "@/hooks/use-toast";
import type { Lead, MotivoDescarte } from "@/types";

interface AtendimentoHeaderProps {
  lead: Lead;
  perfis: { id: string; nome: string }[];
  motivos: MotivoDescarte[];
  podeTransferir: boolean;
}

export function AtendimentoHeader({
  lead,
  perfis,
  motivos,
  podeTransferir,
}: AtendimentoHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [descartarOpen, setDescartarOpen] = useState(false);
  const [transferirOpen, setTransferirOpen] = useState(false);

  const nome = lead.nome?.trim() || "Atendimento sem nome";
  const telLink = buildTelLink(lead.telefone);
  const waLink = buildWhatsAppLink(lead.telefone);
  const codigo = lead.codigo_atendimento;

  function runAction(action: () => Promise<{ error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }
      toast({ title: result.message ?? "Atualizado." });
      router.refresh();
    });
  }

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {codigo ? (
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                  {codigo}
                </span>
              ) : null}
              <h1 className="truncate text-lg font-semibold text-primary">{nome}</h1>
              <TemperaturaBadge temperatura={lead.temperatura} />
              <SituacaoBadge situacao={lead.situacao} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatTelefoneLead(lead.telefone)} · {ETAPA_LEAD_LABELS[lead.etapa]}
              {lead.tempo_primeira_resposta_min != null ? (
                <> · 1ª resposta: {formatTempoPrimeiraResposta(lead.tempo_primeira_resposta_min)}</>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {telLink ? (
              <Button variant="outline" size="sm" asChild>
                <a href={telLink}>
                  <Phone data-icon="inline-start" />
                  Ligar
                </a>
              </Button>
            ) : null}
            {waLink ? (
              <Button variant="outline" size="sm" asChild>
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle data-icon="inline-start" />
                  WhatsApp
                </a>
              </Button>
            ) : null}

            <details className="relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted [&::-webkit-details-marker]:hidden">
                <MoreVertical className="size-4" />
                Ações
                <ChevronDown className="size-3.5 opacity-60" />
              </summary>
              <div className="absolute right-0 z-30 mt-1 min-w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
                <Link
                  href={`/dashboard/atendimentos/${lead.id}?tab=dados`}
                  className="block px-3 py-2 text-sm hover:bg-muted"
                >
                  Editar dados
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => runAction(() => qualificarLead(lead.id))}
                >
                  <UserCheck className="size-4" />
                  Qualificar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => runAction(() => marcarContatoFeito(lead.id))}
                >
                  Contato feito
                </button>
                {podeTransferir ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => setTransferirOpen(true)}
                  >
                    <UserCog className="size-4" />
                    Transferir
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#E63946] hover:bg-muted"
                  onClick={() => setDescartarOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Descartar
                </button>
                <Link
                  href={`/dashboard/atendimentos/${lead.id}?tab=visitas`}
                  className="block px-3 py-2 text-sm hover:bg-muted"
                >
                  Agendar visita
                </Link>
              </div>
            </details>
          </div>
        </div>
      </div>

      <AtendimentoModals
        leadId={lead.id}
        leadNome={lead.nome}
        perfis={perfis}
        motivos={motivos}
        podeTransferir={podeTransferir}
        descartarOpen={descartarOpen}
        transferirOpen={transferirOpen}
        onDescartarOpenChange={setDescartarOpen}
        onTransferirOpenChange={setTransferirOpen}
      />
    </>
  );
}
