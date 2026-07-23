-- Deskimob Etapa 2 — clientes, perfis, tipos custom, mídias, colunas imoveis

-- ---------------------------------------------------------------------------
-- perfis (team users linked to corretor account)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  foto_url TEXT,
  papel VARCHAR(20) NOT NULL DEFAULT 'corretor',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(corretor_id, user_id)
);

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  cpf VARCHAR(14),
  data_nascimento DATE,
  profissao VARCHAR(100),
  estado_civil VARCHAR(50),
  observacoes TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'lead',
  eh_construtor_investidor BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- tipo_imovel_custom
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tipo_imovel_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  UNIQUE(corretor_id, nome)
);

-- ---------------------------------------------------------------------------
-- midia_origem
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.midia_origem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- imoveis — new columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS codigo_personalizado VARCHAR(50);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS complemento_tipo VARCHAR(50);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS complemento_numero VARCHAR(50);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS complemento_torre VARCHAR(100);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS condominio_nome VARCHAR(255);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_endereco_diferente BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_logradouro VARCHAR(255);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_numero VARCHAR(50);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS portal_bairro VARCHAR(255);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS local_chaves VARCHAR(20);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS chaves_codigo VARCHAR(100);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS chaves_descricao TEXT;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS exclusividade BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS imovel_ocupado BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS contrato_aluguel_ativo BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS aceita_financiamento BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS aceita_permuta BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS imovel_na_planta BOOLEAN DEFAULT false;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS ano_construcao INTEGER;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS salas INTEGER;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS elevadores INTEGER;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS vagas_tipo VARCHAR(20);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS vagas_cobertura VARCHAR(30);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- RLS — perfis
-- ---------------------------------------------------------------------------
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_proprio_corretor_select" ON public.perfis;
DROP POLICY IF EXISTS "perfis_proprio_corretor_insert" ON public.perfis;
DROP POLICY IF EXISTS "perfis_proprio_corretor_update" ON public.perfis;
DROP POLICY IF EXISTS "perfis_proprio_corretor_delete" ON public.perfis;

CREATE POLICY "perfis_proprio_corretor_select"
ON public.perfis FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "perfis_proprio_corretor_insert"
ON public.perfis FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "perfis_proprio_corretor_update"
ON public.perfis FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "perfis_proprio_corretor_delete"
ON public.perfis FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS — clientes
-- ---------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_proprio_corretor_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_delete" ON public.clientes;

CREATE POLICY "clientes_proprio_corretor_select"
ON public.clientes FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "clientes_proprio_corretor_insert"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "clientes_proprio_corretor_update"
ON public.clientes FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "clientes_proprio_corretor_delete"
ON public.clientes FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS — tipo_imovel_custom
-- ---------------------------------------------------------------------------
ALTER TABLE public.tipo_imovel_custom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipo_imovel_custom_proprio_corretor_select" ON public.tipo_imovel_custom;
DROP POLICY IF EXISTS "tipo_imovel_custom_proprio_corretor_insert" ON public.tipo_imovel_custom;
DROP POLICY IF EXISTS "tipo_imovel_custom_proprio_corretor_update" ON public.tipo_imovel_custom;
DROP POLICY IF EXISTS "tipo_imovel_custom_proprio_corretor_delete" ON public.tipo_imovel_custom;

CREATE POLICY "tipo_imovel_custom_proprio_corretor_select"
ON public.tipo_imovel_custom FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "tipo_imovel_custom_proprio_corretor_insert"
ON public.tipo_imovel_custom FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "tipo_imovel_custom_proprio_corretor_update"
ON public.tipo_imovel_custom FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "tipo_imovel_custom_proprio_corretor_delete"
ON public.tipo_imovel_custom FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS — midia_origem
-- ---------------------------------------------------------------------------
ALTER TABLE public.midia_origem ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "midia_origem_proprio_corretor_select" ON public.midia_origem;
DROP POLICY IF EXISTS "midia_origem_proprio_corretor_insert" ON public.midia_origem;
DROP POLICY IF EXISTS "midia_origem_proprio_corretor_update" ON public.midia_origem;
DROP POLICY IF EXISTS "midia_origem_proprio_corretor_delete" ON public.midia_origem;

CREATE POLICY "midia_origem_proprio_corretor_select"
ON public.midia_origem FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "midia_origem_proprio_corretor_insert"
ON public.midia_origem FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "midia_origem_proprio_corretor_update"
ON public.midia_origem FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "midia_origem_proprio_corretor_delete"
ON public.midia_origem FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Seed defaults for existing corretores
-- ---------------------------------------------------------------------------
INSERT INTO public.tipo_imovel_custom (corretor_id, nome)
SELECT c.id, t.nome
FROM public.corretores c
CROSS JOIN (
  VALUES
    ('Apartamento'),
    ('Casa'),
    ('Cobertura'),
    ('Área privativa'),
    ('Studio'),
    ('Terreno'),
    ('Comercial'),
    ('Galpão')
) AS t(nome)
ON CONFLICT (corretor_id, nome) DO NOTHING;

INSERT INTO public.midia_origem (corretor_id, nome, ordem)
SELECT c.id, m.nome, m.ordem
FROM public.corretores c
CROSS JOIN (
  VALUES
    ('Meta Ads', 0),
    ('Google Ads', 1),
    ('Grupo OLX', 2),
    ('Chaves na Mão', 3),
    ('Webimóveis', 4),
    ('Instagram orgânico', 5),
    ('Placa ou faixa', 6),
    ('Site', 7),
    ('Indicação', 8),
    ('WhatsApp direto', 9)
) AS m(nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.midia_origem mo WHERE mo.corretor_id = c.id
);
