-- Public read access for corretor sites (anonymous visitors).
-- Additive policies only — does not enable RLS (owner policies live in init schema).

DROP POLICY IF EXISTS "corretores_public_read" ON public.corretores;
CREATE POLICY "corretores_public_read"
ON public.corretores
FOR SELECT
TO anon, authenticated
USING (slug IS NOT NULL AND slug <> '');

DROP POLICY IF EXISTS "imoveis_public_site_read" ON public.imoveis;
CREATE POLICY "imoveis_public_site_read"
ON public.imoveis
FOR SELECT
TO anon, authenticated
USING (publicado_site = true AND status = 'disponivel');
