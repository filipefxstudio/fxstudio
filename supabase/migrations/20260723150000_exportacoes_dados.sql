-- Documento K — registro de exportações de dados (LGPD / auditoria)

CREATE TABLE IF NOT EXISTS public.exportacoes_dados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL REFERENCES public.corretores(id),
  usuario_id uuid NOT NULL,
  grupos_exportados text[] NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exportacoes_dados_corretor
  ON public.exportacoes_dados(corretor_id);

ALTER TABLE public.exportacoes_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exportacoes_dados_proprio_corretor_select" ON public.exportacoes_dados;
DROP POLICY IF EXISTS "exportacoes_dados_proprio_corretor_insert" ON public.exportacoes_dados;

CREATE POLICY "exportacoes_dados_proprio_corretor_select"
ON public.exportacoes_dados FOR SELECT TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "exportacoes_dados_proprio_corretor_insert"
ON public.exportacoes_dados FOR INSERT TO authenticated
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

NOTIFY pgrst, 'reload schema';
