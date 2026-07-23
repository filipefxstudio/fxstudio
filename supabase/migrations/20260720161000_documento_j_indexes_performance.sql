-- Documento J — índices para filtros e FKs em colunas quentes

-- Tenant isolation
CREATE INDEX IF NOT EXISTS idx_corretores_user_id ON public.corretores(user_id);
CREATE INDEX IF NOT EXISTS idx_perfis_corretor_user ON public.perfis(corretor_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_corretor ON public.assinaturas(corretor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_corretor ON public.clientes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_corretor_perfil ON public.clientes(corretor_id, perfil_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor ON public.imoveis(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_status ON public.imoveis(corretor_id, status);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_status_aprovacao ON public.imoveis(corretor_id, status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_imovel_fotos_imovel ON public.imovel_fotos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_leads_corretor ON public.leads(corretor_id);
CREATE INDEX IF NOT EXISTS idx_leads_corretor_situacao ON public.leads(corretor_id, situacao);
CREATE INDEX IF NOT EXISTS idx_leads_corretor_perfil ON public.leads(corretor_id, perfil_id);
CREATE INDEX IF NOT EXISTS idx_leads_corretor_etapa ON public.leads(corretor_id, etapa);
CREATE INDEX IF NOT EXISTS idx_leads_imovel_id ON public.leads(imovel_id);
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id ON public.leads(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lead_interacoes_lead ON public.lead_interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interacoes_corretor ON public.lead_interacoes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_lead_imoveis_corretor ON public.lead_imoveis_selecionados(corretor_id);
CREATE INDEX IF NOT EXISTS idx_lead_imoveis_lead ON public.lead_imoveis_selecionados(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_imoveis_imovel ON public.lead_imoveis_selecionados(imovel_id);
CREATE INDEX IF NOT EXISTS idx_visitas_lead ON public.visitas(lead_id);
CREATE INDEX IF NOT EXISTS idx_visitas_imovel ON public.visitas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_propostas_lead ON public.propostas(lead_id);
CREATE INDEX IF NOT EXISTS idx_propostas_imovel ON public.propostas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_negocios_lead ON public.negocios(lead_id);
CREATE INDEX IF NOT EXISTS idx_negocios_imovel ON public.negocios(imovel_id);
CREATE INDEX IF NOT EXISTS idx_agenda_corretor_lead ON public.agenda(corretor_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_agenda_lead ON public.agenda(lead_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_atendimento_corretor ON public.auditoria_atendimento(corretor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_imovel_corretor ON public.auditoria_imovel(corretor_id);
CREATE INDEX IF NOT EXISTS idx_tipo_imovel_custom_corretor ON public.tipo_imovel_custom(corretor_id);
CREATE INDEX IF NOT EXISTS idx_midia_origem_corretor ON public.midia_origem(corretor_id);
CREATE INDEX IF NOT EXISTS idx_status_imovel_corretor ON public.status_imovel(corretor_id);
CREATE INDEX IF NOT EXISTS idx_tipos_compromisso_corretor ON public.tipos_compromisso(corretor_id);
CREATE INDEX IF NOT EXISTS idx_config_ficha_visita_corretor ON public.config_ficha_visita(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_cliente_id ON public.imoveis(cliente_id);
