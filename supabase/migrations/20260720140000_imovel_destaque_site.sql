ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS destaque_site BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.imoveis.destaque_site IS
  'Quando true, o imóvel aparece na seção de destaques do site (requer publicado_site).';
