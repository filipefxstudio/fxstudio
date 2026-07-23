-- Deskimob — dashboard_config thresholds per corretor

CREATE TABLE IF NOT EXISTS public.dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE UNIQUE,
  leads_verde_dias INTEGER DEFAULT 5,
  leads_amarelo_dias INTEGER DEFAULT 10,
  imoveis_verde_dias INTEGER DEFAULT 30,
  imoveis_amarelo_dias INTEGER DEFAULT 45,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Seed rows for existing corretores
INSERT INTO public.dashboard_config (corretor_id)
SELECT c.id FROM public.corretores c
WHERE NOT EXISTS (
  SELECT 1 FROM public.dashboard_config dc WHERE dc.corretor_id = c.id
);

-- ---------------------------------------------------------------------------
-- RLS — dashboard_config
-- ---------------------------------------------------------------------------
ALTER TABLE public.dashboard_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_select" ON public.dashboard_config;
DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_insert" ON public.dashboard_config;
DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_update" ON public.dashboard_config;

CREATE POLICY "dashboard_config_proprio_corretor_select"
ON public.dashboard_config FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "dashboard_config_proprio_corretor_insert"
ON public.dashboard_config FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "dashboard_config_proprio_corretor_update"
ON public.dashboard_config FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
