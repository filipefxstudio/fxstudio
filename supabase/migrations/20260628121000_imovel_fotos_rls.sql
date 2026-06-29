-- FX Studio — RLS policies for table `imovel_fotos`
--
-- How to apply:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--
-- Root cause: RLS is enabled on imovel_fotos but no INSERT/SELECT policies
-- were defined in the init schema (only imoveis/leads had policies).
-- lib/actions/imoveis.ts inserts foto rows via the authenticated server client.
--
-- Prerequisites:
--   - Tables corretores (id, user_id), imoveis (id, corretor_id), imovel_fotos exist
--   - imoveis INSERT policy already allows corretor to create imoveis (required before fotos)

-- ---------------------------------------------------------------------------
-- Enable RLS (no-op if already enabled)
-- ---------------------------------------------------------------------------
ALTER TABLE public.imovel_fotos ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Drop existing policies (idempotent re-run)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "imovel_fotos_proprio_corretor_select" ON public.imovel_fotos;
DROP POLICY IF EXISTS "imovel_fotos_proprio_corretor_insert" ON public.imovel_fotos;
DROP POLICY IF EXISTS "imovel_fotos_proprio_corretor_update" ON public.imovel_fotos;
DROP POLICY IF EXISTS "imovel_fotos_proprio_corretor_delete" ON public.imovel_fotos;
DROP POLICY IF EXISTS "imovel_fotos_publicas_leitura" ON public.imovel_fotos;

-- ---------------------------------------------------------------------------
-- SELECT — corretor sees fotos of own imoveis
-- ---------------------------------------------------------------------------
CREATE POLICY "imovel_fotos_proprio_corretor_select"
ON public.imovel_fotos
FOR SELECT
TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- INSERT — corretor adds fotos to own imoveis
-- ---------------------------------------------------------------------------
CREATE POLICY "imovel_fotos_proprio_corretor_insert"
ON public.imovel_fotos
FOR INSERT
TO authenticated
WITH CHECK (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- UPDATE — corretor edits fotos of own imoveis
-- ---------------------------------------------------------------------------
CREATE POLICY "imovel_fotos_proprio_corretor_update"
ON public.imovel_fotos
FOR UPDATE
TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- DELETE — corretor removes fotos from own imoveis
-- ---------------------------------------------------------------------------
CREATE POLICY "imovel_fotos_proprio_corretor_delete"
ON public.imovel_fotos
FOR DELETE
TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- SELECT — public read for published available imoveis (site vitrine)
-- ---------------------------------------------------------------------------
CREATE POLICY "imovel_fotos_publicas_leitura"
ON public.imovel_fotos
FOR SELECT
TO public
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE publicado_site = true
      AND status = 'disponivel'
  )
);

-- ---------------------------------------------------------------------------
-- Verify imoveis INSERT policy exists (run separately if cadastro de imóvel fails)
-- Expected policy from init schema: imoveis_proprio_corretor_insert
--
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'imoveis' AND cmd = 'INSERT';
--
-- If missing, create:
-- CREATE POLICY "imoveis_proprio_corretor_insert" ON public.imoveis
-- FOR INSERT TO authenticated
-- WITH CHECK (
--   corretor_id IN (
--     SELECT id FROM public.corretores WHERE user_id = auth.uid()
--   )
-- );
