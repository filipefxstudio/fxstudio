-- Deskimob Etapa 4 — visitas, propostas, negócios, agenda, auditoria

-- visitas
CREATE TABLE IF NOT EXISTS public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES public.imoveis(id),
  perfil_id UUID REFERENCES public.perfis(id),
  data_visita TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'agendada',
  parecer VARCHAR(20),
  vai_gerar_proposta VARCHAR(10),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- propostas
CREATE TABLE IF NOT EXISTS public.propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES public.imoveis(id),
  perfil_id UUID REFERENCES public.perfis(id),
  valor_proposto DECIMAL(15,2) NOT NULL,
  data_proposta DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'em_analise',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- negocios
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES public.imoveis(id),
  proposta_id UUID REFERENCES public.propostas(id),
  perfil_id UUID REFERENCES public.perfis(id),
  valor_fechamento DECIMAL(15,2) NOT NULL,
  valor_comissao DECIMAL(15,2),
  percentual_comissao DECIMAL(5,2),
  data_fechamento DATE NOT NULL,
  data_prevista_comissao DATE,
  data_recebimento_comissao DATE,
  forma_pagamento VARCHAR(20),
  status VARCHAR(20) DEFAULT 'fechado',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- lead_imoveis_selecionados
CREATE TABLE IF NOT EXISTS public.lead_imoveis_selecionados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  token_compartilhamento VARCHAR(64) UNIQUE NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id, imovel_id)
);

-- agenda
CREATE TABLE IF NOT EXISTS public.agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES public.perfis(id),
  lead_id UUID REFERENCES public.leads(id),
  imovel_id UUID REFERENCES public.imoveis(id),
  visita_id UUID REFERENCES public.visitas(id),
  tipo VARCHAR(20) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_atividade TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  lembrete_email BOOLEAN DEFAULT false,
  lembrete_enviado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- auditoria_atendimento
CREATE TABLE IF NOT EXISTS public.auditoria_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.corretores(id),
  perfil_id UUID REFERENCES public.perfis(id),
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visitas_corretor_lead ON public.visitas(corretor_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_propostas_corretor_lead ON public.propostas(corretor_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_negocios_corretor_lead ON public.negocios(corretor_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_agenda_corretor_data ON public.agenda(corretor_id, data_atividade);
CREATE INDEX IF NOT EXISTS idx_lead_imoveis_token ON public.lead_imoveis_selecionados(token_compartilhamento);
CREATE INDEX IF NOT EXISTS idx_auditoria_lead ON public.auditoria_atendimento(lead_id, criado_em DESC);

-- Helper: corretor owns row
-- RLS — visitas
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitas_proprio_corretor_select" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_insert" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_update" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_delete" ON public.visitas;

CREATE POLICY "visitas_proprio_corretor_select"
ON public.visitas FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "visitas_proprio_corretor_insert"
ON public.visitas FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "visitas_proprio_corretor_update"
ON public.visitas FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "visitas_proprio_corretor_delete"
ON public.visitas FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — propostas
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "propostas_proprio_corretor_select" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_insert" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_update" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_delete" ON public.propostas;

CREATE POLICY "propostas_proprio_corretor_select"
ON public.propostas FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "propostas_proprio_corretor_insert"
ON public.propostas FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "propostas_proprio_corretor_update"
ON public.propostas FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "propostas_proprio_corretor_delete"
ON public.propostas FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — negocios
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "negocios_proprio_corretor_select" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_insert" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_update" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_delete" ON public.negocios;

CREATE POLICY "negocios_proprio_corretor_select"
ON public.negocios FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "negocios_proprio_corretor_insert"
ON public.negocios FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "negocios_proprio_corretor_update"
ON public.negocios FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "negocios_proprio_corretor_delete"
ON public.negocios FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — lead_imoveis_selecionados (authenticated corretor; public via service role)
ALTER TABLE public.lead_imoveis_selecionados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_select" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_insert" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_update" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_delete" ON public.lead_imoveis_selecionados;

CREATE POLICY "lead_imoveis_proprio_corretor_select"
ON public.lead_imoveis_selecionados FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "lead_imoveis_proprio_corretor_insert"
ON public.lead_imoveis_selecionados FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "lead_imoveis_proprio_corretor_update"
ON public.lead_imoveis_selecionados FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "lead_imoveis_proprio_corretor_delete"
ON public.lead_imoveis_selecionados FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — agenda
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_proprio_corretor_select" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_insert" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_update" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_delete" ON public.agenda;

CREATE POLICY "agenda_proprio_corretor_select"
ON public.agenda FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "agenda_proprio_corretor_insert"
ON public.agenda FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "agenda_proprio_corretor_update"
ON public.agenda FOR UPDATE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
)
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "agenda_proprio_corretor_delete"
ON public.agenda FOR DELETE TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

-- RLS — auditoria_atendimento
ALTER TABLE public.auditoria_atendimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_proprio_corretor_select" ON public.auditoria_atendimento;
DROP POLICY IF EXISTS "auditoria_proprio_corretor_insert" ON public.auditoria_atendimento;

CREATE POLICY "auditoria_proprio_corretor_select"
ON public.auditoria_atendimento FOR SELECT TO authenticated
USING (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);

CREATE POLICY "auditoria_proprio_corretor_insert"
ON public.auditoria_atendimento FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IN (SELECT id FROM public.corretores WHERE user_id = auth.uid())
);
