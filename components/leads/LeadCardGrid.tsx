"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { TemperaturaBadge } from "@/components/leads/TemperaturaBadge";
import { ETAPA_LEAD_LABELS } from "@/lib/constants/leads";
import {
  buildTelLink,
  buildWhatsAppLink,
  formatOrigemDisplay,
  formatTelefoneLead,
  getInteresseResumido,
} from "@/lib/leads/format";
import type { Lead } from "@/types";

interface LeadCardGridProps {
  leads: Lead[];
  basePath?: string;
  showResponsavel?: boolean;
  perfis?: { id: string; nome: string }[];
  renderActions?: (lead: Lead) => ReactNode;
  children?: (lead: Lead) => ReactNode;
}

export function LeadCardGrid({
  leads,
  basePath = "/dashboard/atendimentos",
  showResponsavel = false,
  perfis = [],
  renderActions,
  children,
}: LeadCardGridProps) {
  if (leads.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum atendimento encontrado com os filtros atuais.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => (
        <LeadCardItem
          key={lead.id}
          lead={lead}
          basePath={basePath}
          showResponsavel={showResponsavel}
          perfis={perfis}
          actions={renderActions?.(lead) ?? children?.(lead)}
        />
      ))}
    </div>
  );
}

function LeadCardItem({
  lead,
  basePath,
  showResponsavel,
  perfis,
  actions,
}: {
  lead: Lead;
  basePath: string;
  showResponsavel?: boolean;
  perfis: { id: string; nome: string }[];
  actions?: ReactNode;
}) {
  const telLink = buildTelLink(lead.telefone);
  const waLink = buildWhatsAppLink(lead.telefone);
  const href = `${basePath}/${lead.id}`;
  const responsavelNome =
    lead.perfil?.nome ??
    perfis.find((p) => p.id === lead.perfil_id)?.nome ??
    null;

  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {lead.codigo_atendimento ? (
              <span className="font-mono text-xs text-muted-foreground">{lead.codigo_atendimento}</span>
            ) : null}
            <p className="font-semibold text-primary">
              {lead.nome?.trim() || "Atendimento sem nome"}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTelefoneLead(lead.telefone)}
          </p>
          {showResponsavel && responsavelNome ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Responsável: <span className="font-medium text-foreground">{responsavelNome}</span>
            </p>
          ) : null}
        </div>
        <TemperaturaBadge temperatura={lead.temperatura} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {getInteresseResumido(lead)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-muted px-2 py-0.5">
          {ETAPA_LEAD_LABELS[lead.etapa]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5">
          {formatOrigemDisplay(lead.origem)}
        </span>
      </div>

      <div
        className="mt-4 flex gap-2 border-t border-border/60 pt-3"
        onClick={(e) => e.preventDefault()}
      >
        {actions ?? (
          <>
            {telLink ? (
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = telLink;
                }}
              >
                <Phone className="size-3.5" />
                Ligar
              </button>
            ) : null}
            {waLink ? (
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#2DC653]/40 bg-[#2DC653]/10 px-2 py-1.5 text-xs font-medium text-[#1a7a34] hover:bg-[#2DC653]/20"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(waLink, "_blank", "noopener,noreferrer");
                }}
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </button>
            ) : null}
          </>
        )}
      </div>
    </Link>
  );
}
