-- FX Studio — Storage policies for bucket `imoveis-fotos`
--
-- How to apply:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--
-- Prerequisites:
--   - Bucket `imoveis-fotos` exists and is set to Public
--   - Tables `corretores` (id, user_id) and `imoveis` (id, corretor_id) exist
--
-- Upload path (must match lib/actions/imoveis.ts):
--   {corretor_id}/{imovel_id}/{uuid}.{ext}

-- ---------------------------------------------------------------------------
-- Drop existing policies (idempotent re-run)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "imoveis_fotos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_corretor_upload" ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_corretor_update" ON storage.objects;
DROP POLICY IF EXISTS "imoveis_fotos_corretor_delete" ON storage.objects;

-- ---------------------------------------------------------------------------
-- SELECT — public read (anonymous + authenticated)
-- ---------------------------------------------------------------------------
CREATE POLICY "imoveis_fotos_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imoveis-fotos');

-- ---------------------------------------------------------------------------
-- INSERT — authenticated corretor uploads to own folder only
-- Path: {corretor_id}/{imovel_id}/...
-- ---------------------------------------------------------------------------
CREATE POLICY "imoveis_fotos_corretor_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'imoveis-fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- UPDATE — same ownership as INSERT (overwrite / metadata)
-- ---------------------------------------------------------------------------
CREATE POLICY "imoveis_fotos_corretor_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'imoveis-fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'imoveis-fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- DELETE — authenticated corretor removes own photos only
-- ---------------------------------------------------------------------------
CREATE POLICY "imoveis_fotos_corretor_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'imoveis-fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.imoveis
    WHERE corretor_id IN (
      SELECT id FROM public.corretores WHERE user_id = auth.uid()
    )
  )
);
