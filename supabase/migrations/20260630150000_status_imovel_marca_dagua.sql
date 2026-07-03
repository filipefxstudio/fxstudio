-- FX Studio — status_imovel, marca_dagua_config, imoveis columns

CREATE TABLE IF NOT EXISTS public.status_imovel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(20) NOT NULL,
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(corretor_id, nome)
);

CREATE TABLE IF NOT EXISTS public.marca_dagua_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  tamanho_percent INTEGER DEFAULT 30 CHECK (tamanho_percent BETWEEN 10 AND 100),
  opacidade_percent INTEGER DEFAULT 50 CHECK (opacidade_percent BETWEEN 10 AND 100),
  posicao VARCHAR(30) DEFAULT 'inferior_direito',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS status_imovel_id UUID REFERENCES public.status_imovel(id);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS data_ativacao TIMESTAMP;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS data_desativacao TIMESTAMP;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS data_ultima_atualizacao TIMESTAMP;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_cep VARCHAR(10);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_cidade VARCHAR(100);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_estado VARCHAR(2);

-- ---------------------------------------------------------------------------
-- RLS — status_imovel
-- ---------------------------------------------------------------------------
ALTER TABLE public.status_imovel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_imovel_proprio_corretor_select" ON public.status_imovel;
DROP POLICY IF EXISTS "status_imovel_proprio_corretor_insert" ON public.status_imovel;
DROP POLICY IF EXISTS "status_imovel_proprio_corretor_update" ON public.status_imovel;
DROP POLICY IF EXISTS "status_imovel_proprio_corretor_delete" ON public.status_imovel;

CREATE POLICY "status_imovel_proprio_corretor_select"
ON public.status_imovel FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "status_imovel_proprio_corretor_insert"
ON public.status_imovel FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "status_imovel_proprio_corretor_update"
ON public.status_imovel FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "status_imovel_proprio_corretor_delete"
ON public.status_imovel FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS — marca_dagua_config
-- ---------------------------------------------------------------------------
ALTER TABLE public.marca_dagua_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marca_dagua_config_proprio_corretor_select" ON public.marca_dagua_config;
DROP POLICY IF EXISTS "marca_dagua_config_proprio_corretor_insert" ON public.marca_dagua_config;
DROP POLICY IF EXISTS "marca_dagua_config_proprio_corretor_update" ON public.marca_dagua_config;
DROP POLICY IF EXISTS "marca_dagua_config_proprio_corretor_delete" ON public.marca_dagua_config;

CREATE POLICY "marca_dagua_config_proprio_corretor_select"
ON public.marca_dagua_config FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "marca_dagua_config_proprio_corretor_insert"
ON public.marca_dagua_config FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "marca_dagua_config_proprio_corretor_update"
ON public.marca_dagua_config FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "marca_dagua_config_proprio_corretor_delete"
ON public.marca_dagua_config FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
