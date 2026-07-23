-- FX Studio — garantir colunas de descarte, corrigir FK, RLS UPDATE e reload PostgREST

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS situacao VARCHAR(30) DEFAULT 'em_atendimento';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_descarte_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_descarte_texto TEXT;

-- FK pode ter sido criada apontando para tabela errada/inexistente (erro 23503)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_motivo_descarte_id_fkey;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_motivo_descarte_id_fkey
  FOREIGN KEY (motivo_descarte_id)
  REFERENCES public.motivos_descarte(id)
  ON DELETE SET NULL;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leads'
      AND cmd = 'UPDATE'
  ) THEN
    CREATE POLICY "leads_proprio_corretor_update"
    ON public.leads FOR UPDATE TO authenticated
    USING (
      corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
    )
    WITH CHECK (
      corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
