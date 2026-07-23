-- Deskimob — config_ficha_visita (ficha de visita final)

CREATE TABLE IF NOT EXISTS public.config_ficha_visita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  texto_clausula TEXT,
  percentual_comissao NUMERIC(5, 2) DEFAULT 6.00,
  usa_texto_padrao BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (corretor_id)
);

ALTER TABLE public.config_ficha_visita
  ADD COLUMN IF NOT EXISTS texto_clausula TEXT,
  ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC(5, 2) DEFAULT 6.00,
  ADD COLUMN IF NOT EXISTS usa_texto_padrao BOOLEAN DEFAULT true;

-- RLS
ALTER TABLE public.config_ficha_visita ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_ficha_visita_proprio_corretor_select" ON public.config_ficha_visita;
DROP POLICY IF EXISTS "config_ficha_visita_proprio_corretor_insert" ON public.config_ficha_visita;
DROP POLICY IF EXISTS "config_ficha_visita_proprio_corretor_update" ON public.config_ficha_visita;

CREATE POLICY "config_ficha_visita_proprio_corretor_select"
ON public.config_ficha_visita FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "config_ficha_visita_proprio_corretor_insert"
ON public.config_ficha_visita FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "config_ficha_visita_proprio_corretor_update"
ON public.config_ficha_visita FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
