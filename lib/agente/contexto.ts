import type { Imovel, Lead, LeadInteracao } from "@/types";

export function montarContexto(
  lead: Lead,
  imoveis: Imovel[],
  historico: LeadInteracao[],
): string {
  const perfilLead = lead.nome
    ? `Lead: ${lead.nome} | Tel: ${lead.telefone ?? "não informado"}`
    : "Lead ainda não identificado";

  const interesseLead = [
    lead.finalidade_busca && `Busca: ${lead.finalidade_busca}`,
    lead.tipo_imovel_busca && `Tipo: ${lead.tipo_imovel_busca}`,
    lead.bairros_interesse?.length &&
      `Bairros: ${lead.bairros_interesse.join(", ")}`,
    lead.quartos_minimo && `Mínimo de quartos: ${lead.quartos_minimo}`,
    lead.valor_maximo &&
      `Orçamento até: R$${lead.valor_maximo.toLocaleString("pt-BR")}`,
    lead.prazo_decisao && `Prazo: ${lead.prazo_decisao}`,
  ]
    .filter(Boolean)
    .join("\n");

  const imoveisResumo = imoveis
    .filter((imovel) => imovel.status === "disponivel")
    .map((imovel) => {
      const valor =
        imovel.finalidade === "venda"
          ? `R$${imovel.valor_venda?.toLocaleString("pt-BR") ?? "—"}`
          : `R$${imovel.valor_locacao?.toLocaleString("pt-BR") ?? "—"}/mês`;

      return `- ${imovel.titulo ?? imovel.tipo} | ${imovel.bairro ?? "—"}, ${imovel.cidade ?? "—"} | ${imovel.quartos}q ${imovel.suites}s ${imovel.vagas}vg | ${valor} | ${imovel.area_util ?? "—"}m²${imovel.diferenciais?.length ? ` | ${imovel.diferenciais.join(", ")}` : ""}`;
    })
    .join("\n");

  const historicoRecente = historico
    .slice(-10)
    .map(
      (item) =>
        `${item.de === "lead" ? "Lead" : "Assistente"}: ${item.conteudo}`,
    )
    .join("\n");

  return `
=== PERFIL DO LEAD ===
${perfilLead}
${interesseLead || "Preferências ainda não coletadas"}

=== IMÓVEIS DISPONÍVEIS ===
${imoveisResumo || "Nenhum imóvel disponível no momento"}

=== HISTÓRICO DA CONVERSA (últimas mensagens) ===
${historicoRecente || "Primeira mensagem do lead"}
  `.trim();
}
