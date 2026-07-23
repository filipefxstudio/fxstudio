-- Documento J — RLS helpers, políticas faltantes e isolamento por perfil/corretor

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER bypassa RLS para subconsultas)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rls_corretor_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.corretores WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.rls_perfil_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.perfis
  WHERE user_id = auth.uid()
    AND ativo = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.rls_is_gestor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis
    WHERE user_id = auth.uid()
      AND ativo = true
      AND papel IN ('admin', 'gerente')
  )
$$;

CREATE OR REPLACE FUNCTION public.rls_is_conta_dono()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.corretores WHERE user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.rls_mesmo_corretor(p_corretor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_corretor_id IN (SELECT public.rls_corretor_ids())
$$;

CREATE OR REPLACE FUNCTION public.rls_pode_ver_por_perfil(p_perfil_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.rls_is_conta_dono()
    OR public.rls_is_gestor()
    OR (
      public.rls_perfil_id() IS NOT NULL
      AND p_perfil_id IS NOT NULL
      AND p_perfil_id = public.rls_perfil_id()
    )
$$;

CREATE OR REPLACE FUNCTION public.rls_pode_acessar_lead(p_lead_id uuid, p_corretor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = p_lead_id
      AND l.corretor_id = p_corretor_id
      AND public.rls_mesmo_corretor(l.corretor_id)
      AND public.rls_pode_ver_por_perfil(l.perfil_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.rls_pode_acessar_agenda(
  p_corretor_id uuid,
  p_lead_id uuid,
  p_perfil_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.rls_mesmo_corretor(p_corretor_id)
    AND (
      (
        p_lead_id IS NOT NULL
        AND public.rls_pode_acessar_lead(p_lead_id, p_corretor_id)
      )
      OR (
        p_lead_id IS NULL
        AND public.rls_pode_ver_por_perfil(p_perfil_id)
      )
    )
$$;

REVOKE ALL ON FUNCTION public.rls_corretor_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_perfil_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_is_gestor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_is_conta_dono() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_mesmo_corretor(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_pode_ver_por_perfil(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_pode_acessar_lead(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_pode_acessar_agenda(uuid, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rls_corretor_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_perfil_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_is_gestor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_is_conta_dono() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_mesmo_corretor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_pode_ver_por_perfil(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_pode_acessar_lead(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_pode_acessar_agenda(uuid, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- corretores — RLS + políticas de conta (leitura pública do site preservada)
-- ---------------------------------------------------------------------------
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corretores_proprio_select" ON public.corretores;
DROP POLICY IF EXISTS "corretores_proprio_update" ON public.corretores;

CREATE POLICY "corretores_proprio_select"
ON public.corretores FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "corretores_proprio_update"
ON public.corretores FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- assinaturas — somente leitura pelo tenant (mutações via service role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assinaturas_proprio_corretor_select" ON public.assinaturas;

CREATE POLICY "assinaturas_proprio_corretor_select"
ON public.assinaturas FOR SELECT TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

-- ---------------------------------------------------------------------------
-- imoveis — CRUD tenant (init schema + leitura pública do site)
-- ---------------------------------------------------------------------------
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imoveis_proprio_corretor_select" ON public.imoveis;
DROP POLICY IF EXISTS "imoveis_proprio_corretor_insert" ON public.imoveis;
DROP POLICY IF EXISTS "imoveis_proprio_corretor_update" ON public.imoveis;
DROP POLICY IF EXISTS "imoveis_proprio_corretor_delete" ON public.imoveis;

CREATE POLICY "imoveis_proprio_corretor_select"
ON public.imoveis FOR SELECT TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "imoveis_proprio_corretor_insert"
ON public.imoveis FOR INSERT TO authenticated
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "imoveis_proprio_corretor_update"
ON public.imoveis FOR UPDATE TO authenticated
USING (public.rls_mesmo_corretor(corretor_id))
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "imoveis_proprio_corretor_delete"
ON public.imoveis FOR DELETE TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

-- ---------------------------------------------------------------------------
-- leads — isolamento por corretor + perfil responsável
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_proprio_corretor_select" ON public.leads;
DROP POLICY IF EXISTS "leads_proprio_corretor_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_proprio_corretor_update" ON public.leads;
DROP POLICY IF EXISTS "leads_proprio_corretor_delete" ON public.leads;

CREATE POLICY "leads_proprio_corretor_select"
ON public.leads FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_ver_por_perfil(perfil_id)
);

CREATE POLICY "leads_proprio_corretor_insert"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "leads_proprio_corretor_update"
ON public.leads FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_ver_por_perfil(perfil_id)
)
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "leads_proprio_corretor_delete"
ON public.leads FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND (public.rls_is_conta_dono() OR public.rls_is_gestor())
);

-- ---------------------------------------------------------------------------
-- lead_interacoes
-- ---------------------------------------------------------------------------
ALTER TABLE public.lead_interacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_interacoes_corretor_select" ON public.lead_interacoes;
DROP POLICY IF EXISTS "lead_interacoes_corretor_insert" ON public.lead_interacoes;
DROP POLICY IF EXISTS "lead_interacoes_corretor_update" ON public.lead_interacoes;
DROP POLICY IF EXISTS "lead_interacoes_corretor_delete" ON public.lead_interacoes;

CREATE POLICY "lead_interacoes_corretor_select"
ON public.lead_interacoes FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_interacoes_corretor_insert"
ON public.lead_interacoes FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_interacoes_corretor_update"
ON public.lead_interacoes FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
)
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_interacoes_corretor_delete"
ON public.lead_interacoes FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND (public.rls_is_conta_dono() OR public.rls_is_gestor())
);

-- ---------------------------------------------------------------------------
-- clientes — isolamento por corretor + perfil responsável
-- ---------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_proprio_corretor_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_proprio_corretor_delete" ON public.clientes;

CREATE POLICY "clientes_proprio_corretor_select"
ON public.clientes FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_ver_por_perfil(perfil_id)
);

CREATE POLICY "clientes_proprio_corretor_insert"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "clientes_proprio_corretor_update"
ON public.clientes FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_ver_por_perfil(perfil_id)
)
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "clientes_proprio_corretor_delete"
ON public.clientes FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND (public.rls_is_conta_dono() OR public.rls_is_gestor())
);

-- ---------------------------------------------------------------------------
-- Atendimentos — políticas com escopo de lead/perfil
-- ---------------------------------------------------------------------------
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_imoveis_selecionados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_atendimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitas_proprio_corretor_select" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_insert" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_update" ON public.visitas;
DROP POLICY IF EXISTS "visitas_proprio_corretor_delete" ON public.visitas;

CREATE POLICY "visitas_proprio_corretor_select"
ON public.visitas FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "visitas_proprio_corretor_insert"
ON public.visitas FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "visitas_proprio_corretor_update"
ON public.visitas FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
)
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "visitas_proprio_corretor_delete"
ON public.visitas FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

DROP POLICY IF EXISTS "propostas_proprio_corretor_select" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_insert" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_update" ON public.propostas;
DROP POLICY IF EXISTS "propostas_proprio_corretor_delete" ON public.propostas;

CREATE POLICY "propostas_proprio_corretor_select"
ON public.propostas FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "propostas_proprio_corretor_insert"
ON public.propostas FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "propostas_proprio_corretor_update"
ON public.propostas FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
)
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "propostas_proprio_corretor_delete"
ON public.propostas FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

DROP POLICY IF EXISTS "negocios_proprio_corretor_select" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_insert" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_update" ON public.negocios;
DROP POLICY IF EXISTS "negocios_proprio_corretor_delete" ON public.negocios;

CREATE POLICY "negocios_proprio_corretor_select"
ON public.negocios FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "negocios_proprio_corretor_insert"
ON public.negocios FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "negocios_proprio_corretor_update"
ON public.negocios FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
)
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "negocios_proprio_corretor_delete"
ON public.negocios FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_select" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_insert" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_update" ON public.lead_imoveis_selecionados;
DROP POLICY IF EXISTS "lead_imoveis_proprio_corretor_delete" ON public.lead_imoveis_selecionados;

CREATE POLICY "lead_imoveis_proprio_corretor_select"
ON public.lead_imoveis_selecionados FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_imoveis_proprio_corretor_insert"
ON public.lead_imoveis_selecionados FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_imoveis_proprio_corretor_update"
ON public.lead_imoveis_selecionados FOR UPDATE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
)
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "lead_imoveis_proprio_corretor_delete"
ON public.lead_imoveis_selecionados FOR DELETE TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

DROP POLICY IF EXISTS "agenda_proprio_corretor_select" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_insert" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_update" ON public.agenda;
DROP POLICY IF EXISTS "agenda_proprio_corretor_delete" ON public.agenda;

CREATE POLICY "agenda_proprio_corretor_select"
ON public.agenda FOR SELECT TO authenticated
USING (
  public.rls_pode_acessar_agenda(corretor_id, lead_id, perfil_id)
);

CREATE POLICY "agenda_proprio_corretor_insert"
ON public.agenda FOR INSERT TO authenticated
WITH CHECK (
  public.rls_pode_acessar_agenda(corretor_id, lead_id, perfil_id)
);

CREATE POLICY "agenda_proprio_corretor_update"
ON public.agenda FOR UPDATE TO authenticated
USING (
  public.rls_pode_acessar_agenda(corretor_id, lead_id, perfil_id)
)
WITH CHECK (
  public.rls_pode_acessar_agenda(corretor_id, lead_id, perfil_id)
);

CREATE POLICY "agenda_proprio_corretor_delete"
ON public.agenda FOR DELETE TO authenticated
USING (
  public.rls_pode_acessar_agenda(corretor_id, lead_id, perfil_id)
);

DROP POLICY IF EXISTS "auditoria_proprio_corretor_select" ON public.auditoria_atendimento;
DROP POLICY IF EXISTS "auditoria_proprio_corretor_insert" ON public.auditoria_atendimento;

CREATE POLICY "auditoria_proprio_corretor_select"
ON public.auditoria_atendimento FOR SELECT TO authenticated
USING (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

CREATE POLICY "auditoria_proprio_corretor_insert"
ON public.auditoria_atendimento FOR INSERT TO authenticated
WITH CHECK (
  public.rls_mesmo_corretor(corretor_id)
  AND public.rls_pode_acessar_lead(lead_id, corretor_id)
);

-- ---------------------------------------------------------------------------
-- tipos_compromisso — padrões globais (corretor_id NULL) + custom por tenant
-- ---------------------------------------------------------------------------
ALTER TABLE public.tipos_compromisso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipos_compromisso_select" ON public.tipos_compromisso;
DROP POLICY IF EXISTS "tipos_compromisso_insert" ON public.tipos_compromisso;
DROP POLICY IF EXISTS "tipos_compromisso_update" ON public.tipos_compromisso;
DROP POLICY IF EXISTS "tipos_compromisso_delete" ON public.tipos_compromisso;

CREATE POLICY "tipos_compromisso_select"
ON public.tipos_compromisso FOR SELECT TO authenticated
USING (
  corretor_id IS NULL
  OR public.rls_mesmo_corretor(corretor_id)
);

CREATE POLICY "tipos_compromisso_insert"
ON public.tipos_compromisso FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IS NOT NULL
  AND public.rls_mesmo_corretor(corretor_id)
);

CREATE POLICY "tipos_compromisso_update"
ON public.tipos_compromisso FOR UPDATE TO authenticated
USING (
  corretor_id IS NOT NULL
  AND public.rls_mesmo_corretor(corretor_id)
)
WITH CHECK (
  corretor_id IS NOT NULL
  AND public.rls_mesmo_corretor(corretor_id)
);

CREATE POLICY "tipos_compromisso_delete"
ON public.tipos_compromisso FOR DELETE TO authenticated
USING (
  corretor_id IS NOT NULL
  AND public.rls_mesmo_corretor(corretor_id)
);

-- ---------------------------------------------------------------------------
-- config_ficha_visita — DELETE faltante
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "config_ficha_visita_proprio_corretor_delete" ON public.config_ficha_visita;

CREATE POLICY "config_ficha_visita_proprio_corretor_delete"
ON public.config_ficha_visita FOR DELETE TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

NOTIFY pgrst, 'reload schema';
