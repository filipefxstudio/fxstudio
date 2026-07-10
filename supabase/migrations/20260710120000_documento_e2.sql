-- FX Studio Documento E2 — colunas e tabelas da jornada completa

-- leads.temperatura: incluir 'indefinido' como padrão
ALTER TABLE public.leads
  ALTER COLUMN temperatura SET DEFAULT 'indefinido';

UPDATE public.leads
SET temperatura = 'indefinido'
WHERE temperatura IS NULL OR temperatura = '';

-- lead_imoveis_selecionados: interesse inicial e token UUID
ALTER TABLE public.lead_imoveis_selecionados
  ADD COLUMN IF NOT EXISTS interesse_inicial BOOLEAN DEFAULT false;

-- token_compartilhamento como UUID (migra valores hex existentes quando possível)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_imoveis_selecionados'
      AND column_name = 'token_compartilhamento'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.lead_imoveis_selecionados
      ALTER COLUMN token_compartilhamento DROP NOT NULL;

    ALTER TABLE public.lead_imoveis_selecionados
      ALTER COLUMN token_compartilhamento TYPE UUID
      USING (
        CASE
          WHEN token_compartilhamento ~ '^[0-9a-f]{32}$' THEN
            (
              substring(token_compartilhamento, 1, 8) || '-' ||
              substring(token_compartilhamento, 9, 4) || '-' ||
              substring(token_compartilhamento, 13, 4) || '-' ||
              substring(token_compartilhamento, 17, 4) || '-' ||
              substring(token_compartilhamento, 21, 12)
            )::uuid
          ELSE gen_random_uuid()
        END
      );

    ALTER TABLE public.lead_imoveis_selecionados
      ALTER COLUMN token_compartilhamento SET DEFAULT gen_random_uuid();

    ALTER TABLE public.lead_imoveis_selecionados
      ALTER COLUMN token_compartilhamento SET NOT NULL;
  END IF;
END $$;

-- Garantir UNIQUE (lead_id, imovel_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lead_imoveis_selecionados_lead_id_imovel_id_key'
  ) THEN
    ALTER TABLE public.lead_imoveis_selecionados
      ADD CONSTRAINT lead_imoveis_selecionados_lead_id_imovel_id_key
      UNIQUE (lead_id, imovel_id);
  END IF;
END $$;

-- perfis.ativo (já existe na etapa 2; garantir default)
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- imoveis.status_aprovacao: cadastro_incompleto → em_cadastro
UPDATE public.imoveis
SET status_aprovacao = 'em_cadastro'
WHERE status_aprovacao = 'cadastro_incompleto';

ALTER TABLE public.imoveis
  ALTER COLUMN status_aprovacao SET DEFAULT 'em_cadastro';

-- Multi-captador
CREATE TABLE IF NOT EXISTS public.imovel_captadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  nome_externo VARCHAR(255),
  principal BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (imovel_id, perfil_id)
);

CREATE INDEX IF NOT EXISTS idx_imovel_captadores_imovel
  ON public.imovel_captadores(imovel_id);

ALTER TABLE public.imovel_captadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imovel_captadores_corretor_select" ON public.imovel_captadores;
DROP POLICY IF EXISTS "imovel_captadores_corretor_insert" ON public.imovel_captadores;
DROP POLICY IF EXISTS "imovel_captadores_corretor_update" ON public.imovel_captadores;
DROP POLICY IF EXISTS "imovel_captadores_corretor_delete" ON public.imovel_captadores;

CREATE POLICY "imovel_captadores_corretor_select"
ON public.imovel_captadores FOR SELECT TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_captadores_corretor_insert"
ON public.imovel_captadores FOR INSERT TO authenticated
WITH CHECK (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_captadores_corretor_update"
ON public.imovel_captadores FOR UPDATE TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);

CREATE POLICY "imovel_captadores_corretor_delete"
ON public.imovel_captadores FOR DELETE TO authenticated
USING (
  imovel_id IN (
    SELECT id FROM public.imoveis
    WHERE corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
  )
);
