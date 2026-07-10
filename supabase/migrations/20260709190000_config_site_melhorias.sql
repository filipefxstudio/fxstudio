-- FX Studio — site melhorias: colunas públicas, hero, motivos desativação

-- Identidade e tarja
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_favicon_url TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_tarja_cor VARCHAR(20) DEFAULT '#1a1a2e';
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_nome_exibicao VARCHAR(255);

-- Página Sobre (separada do hero)
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_sobre_titulo VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_sobre_texto TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_sobre_foto_url TEXT;

-- Página Contato / tarja
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_creci VARCHAR(50);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_telefone_vendas VARCHAR(20);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_telefone_locacao VARCHAR(20);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_email VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_instagram VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_youtube VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_tiktok VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_linkedin VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_facebook VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_horario VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_endereco TEXT;

-- Hero (título/subtítulo separados da página Sobre)
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS hero_titulo VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS hero_subtitulo TEXT;

-- WhatsApp Z-API (número de recebimento)
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS zapi_instance_id VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS zapi_token VARCHAR(255);

-- Migrar dados legados para novos campos site_*
UPDATE public.corretores
SET
  site_sobre_titulo = COALESCE(site_sobre_titulo, sobre_titulo),
  site_sobre_texto = COALESCE(site_sobre_texto, sobre_texto, sobre),
  site_sobre_foto_url = COALESCE(site_sobre_foto_url, sobre_foto_url),
  site_email = COALESCE(site_email, contato_email, email),
  site_horario = COALESCE(site_horario, contato_horario),
  site_endereco = COALESCE(site_endereco, contato_endereco),
  site_creci = COALESCE(site_creci, creci),
  site_telefone_vendas = COALESCE(site_telefone_vendas, contato_telefone, telefone),
  site_nome_exibicao = COALESCE(site_nome_exibicao, nome),
  hero_titulo = COALESCE(hero_titulo, sobre_titulo),
  hero_subtitulo = COALESCE(hero_subtitulo, sobre_texto, sobre)
WHERE TRUE;

-- Motivos de desativação de imóvel (editável por corretor)
CREATE TABLE IF NOT EXISTS public.motivos_desativacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_motivos_desativacao_corretor
  ON public.motivos_desativacao(corretor_id, ordem);

ALTER TABLE public.motivos_desativacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "motivos_desativacao_proprio_corretor_select" ON public.motivos_desativacao;
DROP POLICY IF EXISTS "motivos_desativacao_proprio_corretor_insert" ON public.motivos_desativacao;
DROP POLICY IF EXISTS "motivos_desativacao_proprio_corretor_update" ON public.motivos_desativacao;
DROP POLICY IF EXISTS "motivos_desativacao_proprio_corretor_delete" ON public.motivos_desativacao;

CREATE POLICY "motivos_desativacao_proprio_corretor_select"
ON public.motivos_desativacao FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_desativacao_proprio_corretor_insert"
ON public.motivos_desativacao FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_desativacao_proprio_corretor_update"
ON public.motivos_desativacao FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "motivos_desativacao_proprio_corretor_delete"
ON public.motivos_desativacao FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
