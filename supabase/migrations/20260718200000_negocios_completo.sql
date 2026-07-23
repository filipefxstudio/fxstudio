-- Expansão da tabela negocios para fechamento completo e rateio de comissão

ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS valor_recursos_proprios DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS valor_financiado DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS valor_fgts DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS rateio JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.negocios.rateio IS
  'Array JSON: [{ perfil_id, papel, percentual, valor }]';

CREATE INDEX IF NOT EXISTS idx_negocios_corretor_imovel_status
  ON public.negocios(corretor_id, imovel_id, status);

CREATE INDEX IF NOT EXISTS idx_propostas_corretor_imovel_status
  ON public.propostas(corretor_id, imovel_id, status);
