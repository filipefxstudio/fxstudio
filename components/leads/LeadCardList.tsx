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

interface LeadCardListProps {
  leads: Lead[];
  basePath?: string;
  renderActions?: (lead: Lead) => ReactNode;
  children?: (lead: Lead) => ReactNode;
}

export function LeadCardList({
  leads,
  basePath = "/dashboard/atendimentos",
  renderActions,
  children,
}: LeadCardListProps) {
  if (leads.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum atendimento encontrado com os filtros atuais.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80">
      <div className="divide-y divide-border/70">
        {leads.map((lead) => {
          const telLink = buildTelLink(lead.telefone);
          const waLink = buildWhatsAppLink(lead.telefone);
          const href = `${basePath}/${lead.id}`;
          const actions = renderActions?.(lead) ?? children?.(lead);

          return (
            <Link
              key={lead.id}
              href={href}
              className="flex flex-col gap-3 bg-card p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary">
                    {lead.nome?.trim() || "Atendimento sem nome"}
                  </span>
                  <TemperaturaBadge temperatura={lead.temperatura} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatTelefoneLead(lead.telefone)} · {getInteresseResumido(lead)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{ETAPA_LEAD_LABELS[lead.etapa]}</span>
                  <span>·</span>
                  <span>{formatOrigemDisplay(lead.origem)}</span>
                </div>
              </div>

              <div
                className="flex shrink-0 gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {actions ?? (
                  <>
                    {telLink ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
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
                        className="inline-flex items-center gap-1 rounded-lg border border-[#2DC653]/40 bg-[#2DC653]/10 px-3 py-1.5 text-xs font-medium text-[#1a7a34]"
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
        })}
      </div>
    </div>
  );
}
