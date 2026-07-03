-- FX Studio — publicado_portais toggle for portal syndication
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS publicado_portais BOOLEAN DEFAULT false;
