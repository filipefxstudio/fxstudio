-- FX Studio — Atendimentos etapa: leads extensions, config, motivos descarte

-- leads extensions
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS situacao VARCHAR(30) DEFAULT 'em_atendimento';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS codigo_atendimento VARCHAR(20);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES public.perfis(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS suites_minimas INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS banheiros_minimos INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vagas_minimas INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS entrada_fgts DECIMAL(15,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS entrada_recursos_proprios DECIMAL(15,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS financiamento_aprovado BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS possui_imovel_venda BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interesse_permuta BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS info_permuta TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS obs_financeiras TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMP;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tempo_primeira_resposta_min INTEGER;

-- corretor config rodizio
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS rodizio_ativo BOOLEAN DEFAULT false;

-- config atendimentos per corretor
CREATE TABLE IF NOT EXISTS public.atendimento_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE UNIQUE,
  faixa_valor_percent INTEGER DEFAULT 20,
  ficha_visita_texto TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- motivos descarte
CREATE TABLE IF NOT EXISTS public.motivos_descarte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_motivos_descarte_corretor ON public.motivos_descarte(corretor_id, ordem);

-- unique codigo atendimento per corretor
CREATE UNIQUE INDEX IF NOT EXISTS leads_corretor_codigo_atd_idx
  ON public.leads(corretor_id, codigo_atendimento)
  WHERE codigo_atendimento IS NOT NULL;

-- RLS — atendimento_config
ALTER TABLE public.atendimento_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atendimento_config_proprio_corretor_select" ON public.atendimento_config;
DROP POLICY IF EXISTS "atendimento_config_proprio_corretor_insert" ON public.atendimento_config;
DROP POLICY IF EXISTS "atendimento_config_proprio_corretor_update" ON public.atendimento_config;

CREATE POLICY "atendimento_config_proprio_corretor_select"
ON public.atendimento_config FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "atendimento_config_proprio_corretor_insert"
ON public.atendimento_config FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "atendimento_config_proprio_corretor_update"
ON public.atendimento_config FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — motivos_descarte
ALTER TABLE public.motivos_descarte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "motivos_descarte_proprio_corretor_select" ON public.motivos_descarte;
DROP POLICY IF EXISTS "motivos_descarte_proprio_corretor_insert" ON public.motivos_descarte;
DROP POLICY IF EXISTS "motivos_descarte_proprio_corretor_update" ON public.motivos_descarte;
DROP POLICY IF EXISTS "motivos_descarte_proprio_corretor_delete" ON public.motivos_descarte;

CREATE POLICY "motivos_descarte_proprio_corretor_select"
ON public.motivos_descarte FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_descarte_proprio_corretor_insert"
ON public.motivos_descarte FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_descarte_proprio_corretor_update"
ON public.motivos_descarte FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_descarte_proprio_corretor_delete"
ON public.motivos_descarte FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
