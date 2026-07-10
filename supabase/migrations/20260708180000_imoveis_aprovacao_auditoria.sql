-- Imóveis: aprovação, auditoria e campos complementares

ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(30) DEFAULT 'cadastro_incompleto';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS destinacao VARCHAR(20);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS captador_id UUID REFERENCES public.perfis(id);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS comissao_percent DECIMAL(5,2);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS exibir_endereco_site VARCHAR(20) DEFAULT 'apenas_bairro';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS exibir_endereco_portais VARCHAR(20) DEFAULT 'apenas_bairro';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS motivo_desativacao TEXT;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS cadastrado_por_perfil_id UUID REFERENCES public.perfis(id);

CREATE TABLE IF NOT EXISTS public.auditoria_imovel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.corretores(id),
  perfil_id UUID REFERENCES public.perfis(id),
  acao VARCHAR(100) NOT NULL,
  motivo TEXT,
  detalhes JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_imovel_imovel ON public.auditoria_imovel(imovel_id, criado_em DESC);

ALTER TABLE public.auditoria_imovel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_imovel_proprio_corretor_select" ON public.auditoria_imovel;
DROP POLICY IF EXISTS "auditoria_imovel_proprio_corretor_insert" ON public.auditoria_imovel;

CREATE POLICY "auditoria_imovel_proprio_corretor_select"
ON public.auditoria_imovel FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "auditoria_imovel_proprio_corretor_insert"
ON public.auditoria_imovel FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

INSERT INTO public.status_imovel (corretor_id, nome, cor, padrao, ativo, ordem)
SELECT c.id, 'Desativado', '#6B7280', false, true, 99
FROM public.corretores c
WHERE NOT EXISTS (
  SELECT 1 FROM public.status_imovel si
  WHERE si.corretor_id = c.id AND si.nome = 'Desativado'
);
