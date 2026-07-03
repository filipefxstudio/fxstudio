"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { AuditoriaAtendimento } from "@/types";

const ACAO_LABELS: Record<string, string> = {
  visita_agendada: "Visita agendada",
  visita_realizada: "Visita realizada",
  visita_atualizada: "Visita atualizada",
  proposta_registrada: "Proposta registrada",
  proposta_status_alterado: "Status da proposta alterado",
  proposta_cancelada: "Proposta cancelada",
  negocio_fechado: "Negócio fechado",
  imovel_indicado: "Imóvel indicado",
  imovel_selecionado: "Imóvel selecionado",
  imovel_removido_selecao: "Imóvel removido da seleção",
  lead_qualificado: "Lead qualificado",
  contato_feito: "Contato feito",
  agenda_criada: "Atividade agendada",
};

interface AuditoriaTabProps {
  registros: AuditoriaAtendimento[];
}

export function AuditoriaTab({ registros }: AuditoriaTabProps) {
  if (registros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum registro de auditoria ainda.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {registros.map((item) => (
        <li key={item.id} className="rounded-xl border border-border p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-primary">
              {ACAO_LABELS[item.acao] ?? item.acao}
            </p>
            <time className="text-xs text-muted-foreground">
              {format(new Date(item.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </time>
          </div>
          {item.detalhes ? (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
              {JSON.stringify(item.detalhes, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
