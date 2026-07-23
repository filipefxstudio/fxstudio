-- Documento H — captadores: colunas ausentes, integridade e RLS de update

ALTER TABLE public.imovel_captadores
  ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL;

ALTER TABLE public.imovel_captadores
  ADD COLUMN IF NOT EXISTS nome_externo VARCHAR(255);

ALTER TABLE public.imovel_captadores
  ADD COLUMN IF NOT EXISTS principal BOOLEAN DEFAULT false;

ALTER TABLE public.imovel_captadores
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();

ALTER TABLE public.imovel_captadores
  DROP CONSTRAINT IF EXISTS imovel_captadores_imovel_id_perfil_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS imovel_captadores_imovel_perfil_unique
  ON public.imovel_captadores (imovel_id, perfil_id)
  WHERE perfil_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'imovel_captadores_perfil_ou_externo_check'
  ) THEN
    ALTER TABLE public.imovel_captadores
      ADD CONSTRAINT imovel_captadores_perfil_ou_externo_check
      CHECK (
        perfil_id IS NOT NULL
        OR NULLIF(TRIM(nome_externo), '') IS NOT NULL
      );
  END IF;
END $$;

DROP POLICY IF EXISTS "imovel_captadores_corretor_update" ON public.imovel_captadores;

CREATE POLICY "imovel_captadores_corretor_update"
ON public.imovel_captadores FOR UPDATE TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);
