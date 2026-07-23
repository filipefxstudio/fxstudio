-- Deskimob — motivo de descarte no lead

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_descarte_id UUID REFERENCES public.motivos_descarte(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_descarte_texto TEXT;
