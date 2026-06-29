"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Bot, Globe, MessageCircle } from "lucide-react";
import type { CSSProperties } from "react";

import { ORIGEM_LEAD_LABELS } from "@/lib/constants/leads";
import { cn } from "@/lib/utils";
import type { Lead, OrigemLead, TemperaturaLead } from "@/types";

interface LeadCardProps {
  lead: Lead;
  index: number;
}

function TemperaturaEmoji({ temperatura }: { temperatura: TemperaturaLead }) {
  if (temperatura === "quente") {
    return (
      <span title="Quente" aria-label="Quente">
        🔥
      </span>
    );
  }

  if (temperatura === "morno") {
    return (
      <span title="Morno" aria-label="Morno">
        🌡
      </span>
    );
  }

  return (
    <span title="Frio" aria-label="Frio">
      ❄️
    </span>
  );
}

function OrigemIcon({ origem }: { origem: OrigemLead }) {
  if (origem === "whatsapp") {
    return <MessageCircle className="size-3" />;
  }

  return <Globe className="size-3" />;
}

function formatTelefone(telefone: string | null | undefined): string {
  if (!telefone) {
    return "Sem telefone";
  }

  const digits = telefone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return telefone;
}

export function getInteresseResumido(lead: Lead): string {
  if (lead.imovel?.titulo) {
    return lead.imovel.titulo;
  }

  const partes: string[] = [];

  if (lead.tipo_imovel_busca) {
    partes.push(lead.tipo_imovel_busca);
  }

  if (lead.bairros_interesse && lead.bairros_interesse.length > 0) {
    partes.push(lead.bairros_interesse.slice(0, 2).join(", "));
  }

  if (lead.finalidade_busca) {
    partes.push(lead.finalidade_busca);
  }

  if (partes.length > 0) {
    return partes.join(" · ");
  }

  return "Interesse não informado";
}

export function LeadCard({ lead, index }: LeadCardProps) {
  const nome = lead.nome?.trim() || "Lead sem nome";
  const interesse = getInteresseResumido(lead);

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => {
        const { style: dragStyle, ...draggableProps } = provided.draggableProps;

        return (
        <div
          ref={provided.innerRef}
          {...draggableProps}
          {...provided.dragHandleProps}
          style={dragStyle as CSSProperties | undefined}
          className={cn(
            "rounded-lg border border-border/70 bg-card p-3 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-md ring-2 ring-secondary/30",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium text-primary">{nome}</p>
                {lead.atendido_por === "agente_ia" ? (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                    title="Atendido por agente IA"
                  >
                    <Bot className="size-3" />
                    🤖
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTelefone(lead.telefone)}
              </p>
            </div>
            <span className="shrink-0 text-base leading-none">
              <TemperaturaEmoji temperatura={lead.temperatura} />
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{interesse}</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                lead.origem === "whatsapp"
                  ? "bg-[#2DC653]/15 text-[#1a7a34]"
                  : "bg-secondary/10 text-secondary",
              )}
            >
              <OrigemIcon origem={lead.origem} />
              {ORIGEM_LEAD_LABELS[lead.origem]}
            </span>
          </div>
        </div>
        );
      }}
    </Draggable>
  );
}
