import type { NegocioRateioItem } from "@/types";

export interface CreateNegocioInput {
  imovel_id: string;
  proposta_id?: string;
  perfil_id?: string;
  valor_fechamento: number;
  valor_comissao?: number;
  percentual_comissao?: number;
  data_fechamento: string;
  data_prevista_comissao?: string;
  forma_pagamento?: string;
  valor_recursos_proprios?: number;
  valor_financiado?: number;
  valor_fgts?: number;
  rateio?: NegocioRateioItem[];
  observacoes?: string;
}
