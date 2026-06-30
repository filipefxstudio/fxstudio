"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

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
}

export function LeadCardList({ leads }: LeadCardListProps) {
  if (leads.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum lead encontrado com os filtros atuais.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80">
      <div className="divide-y divide-border/70">
        {leads.map((lead) => {
          const telLink = buildTelLink(lead.telefone);
          const waLink = buildWhatsAppLink(lead.telefone);

          return (
            <div
              key={lead.id}
              className="flex flex-col gap-3 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {lead.nome?.trim() || "Lead sem nome"}
                  </Link>
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

              <div className="flex shrink-0 gap-2">
                {telLink ? (
                  <a
                    href={telLink}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Phone className="size-3.5" />
                    Ligar
                  </a>
                ) : null}
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#2DC653]/40 bg-[#2DC653]/10 px-3 py-1.5 text-xs font-medium text-[#1a7a34]"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
