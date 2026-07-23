-- Remove duplicate public read policy on imoveis.
-- Keeps imoveis_public_site_read (20260630120000_public_site_rls.sql).
-- imoveis_publicos_leitura duplicated the same USING condition but is not tracked in prior migrations.

DROP POLICY IF EXISTS "imoveis_publicos_leitura" ON public.imoveis;
