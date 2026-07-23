-- dashboard_config — alinhar RLS ao Documento J (helpers SECURITY DEFINER)

DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_select" ON public.dashboard_config;
DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_insert" ON public.dashboard_config;
DROP POLICY IF EXISTS "dashboard_config_proprio_corretor_update" ON public.dashboard_config;

CREATE POLICY "dashboard_config_proprio_corretor_select"
ON public.dashboard_config FOR SELECT TO authenticated
USING (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "dashboard_config_proprio_corretor_insert"
ON public.dashboard_config FOR INSERT TO authenticated
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

CREATE POLICY "dashboard_config_proprio_corretor_update"
ON public.dashboard_config FOR UPDATE TO authenticated
USING (public.rls_mesmo_corretor(corretor_id))
WITH CHECK (public.rls_mesmo_corretor(corretor_id));

NOTIFY pgrst, 'reload schema';
