-- Proprietários adicionais por imóvel (cônjuge / segundo titular)

CREATE TABLE IF NOT EXISTS public.imovel_proprietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (imovel_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_imovel_proprietarios_imovel
  ON public.imovel_proprietarios(imovel_id);

ALTER TABLE public.imovel_proprietarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imovel_proprietarios_corretor_select" ON public.imovel_proprietarios;
DROP POLICY IF EXISTS "imovel_proprietarios_corretor_insert" ON public.imovel_proprietarios;
DROP POLICY IF EXISTS "imovel_proprietarios_corretor_update" ON public.imovel_proprietarios;
DROP POLICY IF EXISTS "imovel_proprietarios_corretor_delete" ON public.imovel_proprietarios;

CREATE POLICY "imovel_proprietarios_corretor_select"
ON public.imovel_proprietarios FOR SELECT TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_proprietarios_corretor_insert"
ON public.imovel_proprietarios FOR INSERT TO authenticated
WITH CHECK (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_proprietarios_corretor_update"
ON public.imovel_proprietarios FOR UPDATE TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_proprietarios_corretor_delete"
ON public.imovel_proprietarios FOR DELETE TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);
