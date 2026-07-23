-- lead_interacoes.criado_em: TIMESTAMP → TIMESTAMPTZ
-- Valores existentes foram gravados via toISOString() (UTC); interpretar como UTC.

ALTER TABLE public.lead_interacoes
  ALTER COLUMN criado_em TYPE TIMESTAMPTZ
  USING criado_em AT TIME ZONE 'UTC';

ALTER TABLE public.lead_interacoes
  ALTER COLUMN criado_em SET DEFAULT NOW();
