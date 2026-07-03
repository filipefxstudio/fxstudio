-- FX Studio — site config columns on corretores

ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_cor_primaria VARCHAR(20) DEFAULT '#1E3A5F';
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS site_cor_secundaria VARCHAR(20) DEFAULT '#F18F01';
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS sobre_titulo VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS sobre_texto TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS sobre_foto_url TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS contato_email VARCHAR(255);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS contato_telefone VARCHAR(20);
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS contato_endereco TEXT;
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS contato_horario VARCHAR(255);

-- Storage bucket for public site assets (logo, hero, sobre photo)

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site_assets_corretor_upload" ON storage.objects;
CREATE POLICY "site_assets_corretor_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "site_assets_corretor_update" ON storage.objects;
CREATE POLICY "site_assets_corretor_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "site_assets_corretor_delete" ON storage.objects;
CREATE POLICY "site_assets_corretor_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.corretores WHERE user_id = auth.uid()
  )
);
