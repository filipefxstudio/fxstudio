import type { SituacaoLead } from "@/types";

export const SITUACAO_LEAD_LABELS: Record<SituacaoLead, string> = {
  em_atendimento: "Em atendimento",
  descartado: "Descartado",
  negocio_fechado: "Negócio fechado",
};

export const DEFAULT_FICHA_VISITA_TEXTO = `Ficha de visita

Corretor: {{nome_corretor}}
Cliente: {{nome_lead}}
Cidade do imóvel: {{cidade_imovel}}
Data: {{dia}}/{{mes}}/{{ano}}

Imóveis visitados:
{{imoveis_lista}}

Observações:
{{observacoes}}
`;

export const DEFAULT_MOTIVOS_DESCARTE = [
  "Sem interesse",
  "Sem retorno",
  "Fora do perfil",
  "Comprou com outro",
] as const;
