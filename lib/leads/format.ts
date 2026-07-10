import type { Lead } from "@/types";

export function formatTelefoneLead(telefone: string | null | undefined): string {
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

export function telefoneDigits(telefone: string | null | undefined): string {
  return telefone?.replace(/\D/g, "") ?? "";
}

export function buildTelLink(telefone: string | null | undefined): string | null {
  const digits = telefoneDigits(telefone);
  return digits.length >= 10 ? `tel:+55${digits}` : null;
}

export function buildWhatsAppLink(telefone: string | null | undefined): string | null {
  const digits = telefoneDigits(telefone);
  return digits.length >= 10 ? `https://wa.me/55${digits}` : null;
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
    partes.push(
      lead.finalidade_busca === "compra"
        ? "Compra"
        : lead.finalidade_busca === "locacao"
          ? "Locação"
          : lead.finalidade_busca,
    );
  }

  if (partes.length > 0) {
    return partes.join(" · ");
  }

  return "Interesse não informado";
}

export function getUltimaAtividadeEm(lead: Lead): string {
  return lead.ultima_mensagem_em ?? lead.atualizado_em ?? lead.criado_em;
}

export function isLeadAtivo(lead: Lead): boolean {
  if (lead.situacao === "descartado" || lead.situacao === "negocio_fechado") {
    return false;
  }
  return lead.etapa !== "fechado" && lead.etapa !== "perdido";
}

export function getLeadResponsavelId(lead: Lead): string | null {
  if (lead.perfil_id) return lead.perfil_id;
  return null;
}

export function formatTempoPrimeiraResposta(minutes: number | null | undefined): string {
  if (minutes == null) {
    return "—";
  }

  const horas = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (horas > 0 && mins > 0) {
    return `${horas}h e ${mins}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${mins}min`;
}

export function formatOrigemDisplay(origem: string): string {
  const map: Record<string, string> = {
    site: "Site",
    whatsapp: "WhatsApp",
    portal: "Portal",
    indicacao: "Indicação",
    manual: "Manual",
  };

  return map[origem] ?? origem;
}
