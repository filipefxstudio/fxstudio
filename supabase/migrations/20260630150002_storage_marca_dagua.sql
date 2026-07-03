-- Storage bucket for marca d'água logos

INSERT INTO storage.buckets (id, name, public)
VALUES ('marca-dagua-logos', 'marca-dagua-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "marca_dagua_logos_public_read" ON storage.objects;
CREATE POLICY "marca_dagua_logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'marca-dagua-logos');

DROP POLICY IF EXISTS "marca_dagua_logos_corretor_upload" ON storage.objects;
CREATE POLICY "marca_dagua_logos_corretor_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'marca-dagua-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "marca_dagua_logos_corretor_update" ON storage.objects;
CREATE POLICY "marca_dagua_logos_corretor_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'marca-dagua-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "marca_dagua_logos_corretor_delete" ON storage.objects;
CREATE POLICY "marca_dagua_logos_corretor_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'marca-dagua-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);
