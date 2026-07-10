-- FX Studio — logo CRM, tipos de compromisso da agenda

ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS logo_crm_url TEXT;

CREATE TABLE IF NOT EXISTS public.tipos_compromisso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(10),
  cor VARCHAR(20),
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO public.tipos_compromisso (nome, icone, padrao, ativo, ordem)
SELECT v.nome, v.icone, true, true, v.ordem
FROM (
  VALUES
    ('Visita', '🏠', 1),
    ('Ligação', '📞', 2),
    ('WhatsApp', '💬', 3),
    ('Reunião', '👥', 4),
    ('Captação', '📷', 5),
    ('Email', '✉️', 6),
    ('Outro', '📅', 7)
) AS v(nome, icone, ordem)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tipos_compromisso t
  WHERE t.nome = v.nome
    AND t.padrao = true
    AND t.corretor_id IS NULL
);
