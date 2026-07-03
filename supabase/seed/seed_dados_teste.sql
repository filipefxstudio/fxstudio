-- =============================================================================
-- FX Studio — Dados de teste (opcional)
-- Execute no Supabase SQL Editor com um corretor já cadastrado.
-- Não remove dados existentes por padrão.
--
-- Limpeza opcional (descomente se quiser remover apenas estes registros):
-- DELETE FROM public.agenda WHERE id::text LIKE 'f0000000-%';
-- DELETE FROM public.negocios WHERE id::text LIKE 'e0000000-%';
-- DELETE FROM public.propostas WHERE id::text LIKE 'd0000000-%';
-- DELETE FROM public.visitas WHERE id::text LIKE 'c0000000-%';
-- DELETE FROM public.lead_interacoes WHERE id::text LIKE 'a1000000-%';
-- DELETE FROM public.leads WHERE id::text LIKE 'b0000000-%';
-- DELETE FROM public.imovel_fotos WHERE id::text LIKE 'ff000000-%';
-- DELETE FROM public.imoveis WHERE id::text LIKE '10000000-%';
-- =============================================================================

-- Passo 1: verificar corretor
SELECT id, nome, slug FROM public.corretores LIMIT 1;

DO $$
DECLARE
  v_corretor_id UUID;
  v_status_disp UUID;
  v_status_res UUID;
  v_status_vend UUID;
  v_status_loc UUID;
  v_imovel_ids UUID[] := ARRAY[
    '10000000-0000-4000-a000-000000000001'::UUID,
    '10000000-0000-4000-a000-000000000002'::UUID,
    '10000000-0000-4000-a000-000000000003'::UUID,
    '10000000-0000-4000-a000-000000000004'::UUID,
    '10000000-0000-4000-a000-000000000005'::UUID,
    '10000000-0000-4000-a000-000000000006'::UUID,
    '10000000-0000-4000-a000-000000000007'::UUID,
    '10000000-0000-4000-a000-000000000008'::UUID,
    '10000000-0000-4000-a000-000000000009'::UUID,
    '10000000-0000-4000-a000-000000000010'::UUID,
    '10000000-0000-4000-a000-000000000011'::UUID,
    '10000000-0000-4000-a000-000000000012'::UUID,
    '10000000-0000-4000-a000-000000000013'::UUID,
    '10000000-0000-4000-a000-000000000014'::UUID,
    '10000000-0000-4000-a000-000000000015'::UUID,
    '10000000-0000-4000-a000-000000000016'::UUID,
    '10000000-0000-4000-a000-000000000017'::UUID,
    '10000000-0000-4000-a000-000000000018'::UUID,
    '10000000-0000-4000-a000-000000000019'::UUID,
    '10000000-0000-4000-a000-000000000020'::UUID
  ];
  v_lead_ids UUID[] := ARRAY[
    'b0000000-0000-4000-a000-000000000001'::UUID,
    'b0000000-0000-4000-a000-000000000002'::UUID,
    'b0000000-0000-4000-a000-000000000003'::UUID,
    'b0000000-0000-4000-a000-000000000004'::UUID,
    'b0000000-0000-4000-a000-000000000005'::UUID,
    'b0000000-0000-4000-a000-000000000006'::UUID,
    'b0000000-0000-4000-a000-000000000007'::UUID,
    'b0000000-0000-4000-a000-000000000008'::UUID,
    'b0000000-0000-4000-a000-000000000009'::UUID,
    'b0000000-0000-4000-a000-000000000010'::UUID,
    'b0000000-0000-4000-a000-000000000011'::UUID,
    'b0000000-0000-4000-a000-000000000012'::UUID,
    'b0000000-0000-4000-a000-000000000013'::UUID,
    'b0000000-0000-4000-a000-000000000014'::UUID,
    'b0000000-0000-4000-a000-000000000015'::UUID,
    'b0000000-0000-4000-a000-000000000016'::UUID,
    'b0000000-0000-4000-a000-000000000017'::UUID,
    'b0000000-0000-4000-a000-000000000018'::UUID,
    'b0000000-0000-4000-a000-000000000019'::UUID,
    'b0000000-0000-4000-a000-000000000020'::UUID,
    'b0000000-0000-4000-a000-000000000021'::UUID,
    'b0000000-0000-4000-a000-000000000022'::UUID,
    'b0000000-0000-4000-a000-000000000023'::UUID,
    'b0000000-0000-4000-a000-000000000024'::UUID,
    'b0000000-0000-4000-a000-000000000025'::UUID,
    'b0000000-0000-4000-a000-000000000026'::UUID,
    'b0000000-0000-4000-a000-000000000027'::UUID,
    'b0000000-0000-4000-a000-000000000028'::UUID,
    'b0000000-0000-4000-a000-000000000029'::UUID,
    'b0000000-0000-4000-a000-000000000030'::UUID
  ];
  v_visita_ids UUID[] := ARRAY[
    'c0000000-0000-4000-a000-000000000001'::UUID,
    'c0000000-0000-4000-a000-000000000002'::UUID,
    'c0000000-0000-4000-a000-000000000003'::UUID,
    'c0000000-0000-4000-a000-000000000004'::UUID,
    'c0000000-0000-4000-a000-000000000005'::UUID,
    'c0000000-0000-4000-a000-000000000006'::UUID,
    'c0000000-0000-4000-a000-000000000007'::UUID,
    'c0000000-0000-4000-a000-000000000008'::UUID,
    'c0000000-0000-4000-a000-000000000009'::UUID,
    'c0000000-0000-4000-a000-000000000010'::UUID
  ];
  v_proposta_ids UUID[] := ARRAY[
    'd0000000-0000-4000-a000-000000000001'::UUID,
    'd0000000-0000-4000-a000-000000000002'::UUID,
    'd0000000-0000-4000-a000-000000000003'::UUID,
    'd0000000-0000-4000-a000-000000000004'::UUID,
    'd0000000-0000-4000-a000-000000000005'::UUID,
    'd0000000-0000-4000-a000-000000000006'::UUID,
    'd0000000-0000-4000-a000-000000000007'::UUID,
    'd0000000-0000-4000-a000-000000000008'::UUID
  ];
  v_negocio_ids UUID[] := ARRAY[
    'e0000000-0000-4000-a000-000000000001'::UUID,
    'e0000000-0000-4000-a000-000000000002'::UUID,
    'e0000000-0000-4000-a000-000000000003'::UUID
  ];
  v_agenda_ids UUID[] := ARRAY[
    'f0000000-0000-4000-a000-000000000001'::UUID,
    'f0000000-0000-4000-a000-000000000002'::UUID,
    'f0000000-0000-4000-a000-000000000003'::UUID,
    'f0000000-0000-4000-a000-000000000004'::UUID,
    'f0000000-0000-4000-a000-000000000005'::UUID,
    'f0000000-0000-4000-a000-000000000006'::UUID,
    'f0000000-0000-4000-a000-000000000007'::UUID,
    'f0000000-0000-4000-a000-000000000008'::UUID,
    'f0000000-0000-4000-a000-000000000009'::UUID,
    'f0000000-0000-4000-a000-000000000010'::UUID,
    'f0000000-0000-4000-a000-000000000011'::UUID,
    'f0000000-0000-4000-a000-000000000012'::UUID,
    'f0000000-0000-4000-a000-000000000013'::UUID,
    'f0000000-0000-4000-a000-000000000014'::UUID,
    'f0000000-0000-4000-a000-000000000015'::UUID,
    'f0000000-0000-4000-a000-000000000016'::UUID,
    'f0000000-0000-4000-a000-000000000017'::UUID,
    'f0000000-0000-4000-a000-000000000018'::UUID,
    'f0000000-0000-4000-a000-000000000019'::UUID,
    'f0000000-0000-4000-a000-000000000020'::UUID
  ];
BEGIN
  SELECT id INTO v_corretor_id FROM public.corretores LIMIT 1;

  IF v_corretor_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum corretor encontrado. Cadastre um corretor primeiro.';
  END IF;

  SELECT id INTO v_status_disp FROM public.status_imovel
  WHERE corretor_id = v_corretor_id AND nome = 'Disponível' LIMIT 1;

  SELECT id INTO v_status_res FROM public.status_imovel
  WHERE corretor_id = v_corretor_id AND nome = 'Reservado' LIMIT 1;

  SELECT id INTO v_status_vend FROM public.status_imovel
  WHERE corretor_id = v_corretor_id AND nome = 'Vendido' LIMIT 1;

  SELECT id INTO v_status_loc FROM public.status_imovel
  WHERE corretor_id = v_corretor_id AND nome = 'Locado' LIMIT 1;

  IF v_status_disp IS NULL THEN
    RAISE EXCEPTION 'Status padrão não encontrado. Execute a migration de status_imovel primeiro.';
  END IF;

  -- ===========================================================================
  -- 20 imóveis (códigos 0001–0020)
  -- ===========================================================================
  INSERT INTO public.imoveis (
    id, corretor_id, codigo, titulo, slug, tipo, finalidade, status, status_imovel_id,
    cep, logradouro, numero, bairro, cidade, estado,
    quartos, suites, banheiros, vagas, area_util, area_total,
    valor_venda, valor_locacao, valor_condominio, valor_iptu,
    descricao, diferenciais, publicado_site, publicado_portais,
    exclusividade, imovel_ocupado, aceita_financiamento, local_chaves,
    visualizacoes, criado_em, atualizado_em
  ) VALUES
    (v_imovel_ids[1],  v_corretor_id, '0001', 'Apartamento 3 quartos Savassi', 'apartamento-3-quartos-savassi-seed-0001', 'apartamento', 'venda', 'disponivel', v_status_disp, '30130100', 'Rua dos Inconfidentes', '890', 'Savassi', 'Belo Horizonte', 'MG', 3, 1, 2, 2, 95, 110, 680000, NULL, 850, 3200, 'Apartamento reformado, próximo ao metrô.', ARRAY['Varanda', 'Portaria 24h', 'Elevador'], true, true, true, false, true, 'portaria', 42, NOW() - INTERVAL '55 days', NOW()),
    (v_imovel_ids[2],  v_corretor_id, '0002', 'Casa ampla Pampulha', 'casa-ampla-pampulha-seed-0002', 'casa', 'venda', 'disponivel', v_status_disp, '31365000', 'Av. Otacílio Negrão de Lima', '1520', 'Pampulha', 'Belo Horizonte', 'MG', 4, 2, 3, 3, 220, 350, 850000, NULL, 0, 1800, 'Casa com quintal e churrasqueira.', ARRAY['Quintal', 'Churrasqueira', 'Suíte master'], true, false, true, false, true, 'proprietario', 28, NOW() - INTERVAL '52 days', NOW()),
    (v_imovel_ids[3],  v_corretor_id, '0003', 'Cobertura duplex Lourdes', 'cobertura-duplex-lourdes-seed-0003', 'cobertura', 'venda', 'reservado', v_status_res, '30170120', 'Rua da Bahia', '1200', 'Lourdes', 'Belo Horizonte', 'MG', 4, 3, 4, 3, 280, 320, 1850000, NULL, 2200, 8500, 'Cobertura com vista panorâmica.', ARRAY['Piscina', 'Varanda', 'Academia', 'Vista para o mar'], true, true, true, false, true, 'portaria', 67, NOW() - INTERVAL '48 days', NOW()),
    (v_imovel_ids[4],  v_corretor_id, '0004', 'Studio mobiliado Funcionários', 'studio-mobiliado-funcionarios-seed-0004', 'studio', 'locacao', 'disponivel', v_status_disp, '30150170', 'Av. do Contorno', '4500', 'Funcionários', 'Belo Horizonte', 'MG', 1, 0, 1, 1, 38, 42, NULL, 2200, 450, 180, 'Studio compacto, ideal para executivos.', ARRAY['Mobiliado', 'Ar condicionado', 'Portaria 24h'], true, false, false, false, false, 'imobiliaria', 15, NOW() - INTERVAL '45 days', NOW()),
    (v_imovel_ids[5],  v_corretor_id, '0005', 'Sala comercial Buritis', 'sala-comercial-buritis-seed-0005', 'comercial', 'locacao', 'locado', COALESCE(v_status_loc, v_status_disp), '30575000', 'Av. Mario Werneck', '800', 'Buritis', 'Belo Horizonte', 'MG', 0, 0, 2, 2, 120, 120, NULL, 5500, 900, 450, 'Sala comercial em prédio corporativo.', ARRAY['Elevador', 'Vaga coberta'], false, false, false, true, false, 'portaria', 8, NOW() - INTERVAL '40 days', NOW()),
    (v_imovel_ids[6],  v_corretor_id, '0006', 'Mansão Belvedere', 'mansao-belvedere-seed-0006', 'casa', 'venda', 'vendido', COALESCE(v_status_vend, v_status_disp), '30320660', 'Rua Jaguara', '450', 'Belvedere', 'Belo Horizonte', 'MG', 5, 4, 5, 4, 450, 800, 2500000, NULL, 0, 12000, 'Residência de alto padrão com piscina.', ARRAY['Piscina', 'Quintal', 'Churrasqueira', 'Suíte master', 'Closet'], false, false, true, false, true, 'proprietario', 91, NOW() - INTERVAL '38 days', NOW()),
    (v_imovel_ids[7],  v_corretor_id, '0007', 'Casa térrea Santa Amélia', 'casa-terrea-santa-amelia-seed-0007', 'casa', 'locacao', 'disponivel', v_status_disp, '31340200', 'Rua Rio Grande do Norte', '320', 'Santa Amélia', 'Belo Horizonte', 'MG', 3, 1, 2, 2, 150, 200, NULL, 3200, 0, 220, 'Casa térrea em rua tranquila.', ARRAY['Quintal', 'Pet friendly'], true, false, false, true, false, 'proprietario', 12, NOW() - INTERVAL '35 days', NOW()),
    (v_imovel_ids[8],  v_corretor_id, '0008', 'Apartamento Castelo', 'apartamento-castelo-seed-0008', 'apartamento', 'venda', 'disponivel', v_status_disp, '31330340', 'Rua Castelo de Setúbal', '180', 'Castelo', 'Belo Horizonte', 'MG', 2, 0, 1, 1, 68, 75, 420000, NULL, 520, 1900, 'Apartamento funcional, boa localização.', ARRAY['Sacada', 'Elevador'], true, true, false, false, true, 'portaria', 33, NOW() - INTERVAL '32 days', NOW()),
    (v_imovel_ids[9],  v_corretor_id, '0009', 'Cobertura Gutierrez', 'cobertura-gutierrez-seed-0009', 'cobertura', 'venda', 'disponivel', v_status_disp, '30441070', 'Rua Antônio de Albuquerque', '950', 'Gutierrez', 'Belo Horizonte', 'MG', 3, 2, 3, 2, 195, 210, 1650000, NULL, 1800, 6200, 'Cobertura com terraço gourmet.', ARRAY['Churrasqueira', 'Varanda', 'Área de lazer'], true, true, true, false, true, 'portaria', 54, NOW() - INTERVAL '30 days', NOW()),
    (v_imovel_ids[10], v_corretor_id, '0010', 'Studio Sion', 'studio-sion-seed-0010', 'studio', 'locacao', 'disponivel', v_status_disp, '30320000', 'Rua Marquês de Maricá', '210', 'Sion', 'Belo Horizonte', 'MG', 1, 0, 1, 1, 32, 35, NULL, 1800, 380, 150, 'Studio econômico próximo à PUC.', ARRAY['Mobiliado'], true, false, false, false, false, 'imobiliaria', 19, NOW() - INTERVAL '28 days', NOW()),
    (v_imovel_ids[11], v_corretor_id, '0011', 'Loja Funcionários', 'loja-funcionarios-seed-0011', 'comercial', 'venda', 'disponivel', v_status_disp, '30150170', 'Av. do Contorno', '5200', 'Funcionários', 'Belo Horizonte', 'MG', 0, 0, 1, 0, 85, 85, 980000, NULL, 0, 3200, 'Ponto comercial em avenida movimentada.', ARRAY['Depósito'], true, true, true, false, false, 'imobiliaria', 22, NOW() - INTERVAL '25 days', NOW()),
    (v_imovel_ids[12], v_corretor_id, '0012', 'Apartamento locação Lourdes', 'apartamento-locacao-lourdes-seed-0012', 'apartamento', 'locacao', 'reservado', v_status_res, '30170120', 'Rua Sergipe', '780', 'Lourdes', 'Belo Horizonte', 'MG', 3, 1, 2, 2, 110, 125, NULL, 4500, 1100, 280, 'Apartamento de luxo para locação.', ARRAY['Portaria 24h', 'Academia', 'Salão de festas'], true, false, false, false, false, 'portaria', 11, NOW() - INTERVAL '22 days', NOW()),
    (v_imovel_ids[13], v_corretor_id, '0013', 'Casa Pampulha com piscina', 'casa-pampulha-piscina-seed-0013', 'casa', 'venda', 'disponivel', v_status_disp, '31365000', 'Rua Professora Dinah Diniz', '280', 'Pampulha', 'Belo Horizonte', 'MG', 4, 2, 3, 3, 280, 400, 1250000, NULL, 0, 2400, 'Casa com piscina aquecida.', ARRAY['Piscina', 'Churrasqueira', 'Quintal'], true, true, true, false, true, 'proprietario', 45, NOW() - INTERVAL '20 days', NOW()),
    (v_imovel_ids[14], v_corretor_id, '0014', 'Apartamento Savassi compacto', 'apartamento-savassi-compacto-seed-0014', 'apartamento', 'venda', 'disponivel', v_status_disp, '30130100', 'Rua Pernambuco', '520', 'Savassi', 'Belo Horizonte', 'MG', 2, 0, 1, 1, 72, 80, 550000, NULL, 680, 2100, 'Apartamento ideal para investimento.', ARRAY['Elevador', 'Sacada'], true, true, false, true, true, 'portaria', 37, NOW() - INTERVAL '18 days', NOW()),
    (v_imovel_ids[15], v_corretor_id, '0015', 'Cobertura locação Belvedere', 'cobertura-locacao-belvedere-seed-0015', 'cobertura', 'locacao', 'disponivel', v_status_disp, '30320660', 'Rua Jaguara', '120', 'Belvedere', 'Belo Horizonte', 'MG', 4, 2, 4, 3, 260, 290, NULL, 7800, 2500, 900, 'Cobertura premium para locação.', ARRAY['Piscina', 'Varanda', 'Academia'], true, false, true, false, false, 'portaria', 29, NOW() - INTERVAL '15 days', NOW()),
    (v_imovel_ids[16], v_corretor_id, '0016', 'Apartamento Buritis', 'apartamento-buritis-seed-0016', 'apartamento', 'venda', 'disponivel', v_status_disp, '30575000', 'Rua Cláudio Manoel', '340', 'Buritis', 'Belo Horizonte', 'MG', 2, 1, 2, 1, 78, 85, 380000, NULL, 490, 1750, 'Apartamento com suíte e vaga.', ARRAY['Vaga coberta', 'Elevador'], true, true, false, false, true, 'portaria', 24, NOW() - INTERVAL '12 days', NOW()),
    (v_imovel_ids[17], v_corretor_id, '0017', 'Casa Gutierrez', 'casa-gutierrez-seed-0017', 'casa', 'venda', 'disponivel', v_status_disp, '30441070', 'Rua dos Aimorés', '650', 'Gutierrez', 'Belo Horizonte', 'MG', 3, 1, 2, 2, 180, 250, 920000, NULL, 0, 1600, 'Casa geminada bem conservada.', ARRAY['Quintal', 'Lavabo'], true, false, true, false, true, 'proprietario', 18, NOW() - INTERVAL '10 days', NOW()),
    (v_imovel_ids[18], v_corretor_id, '0018', 'Studio locado Funcionários', 'studio-locado-funcionarios-seed-0018', 'studio', 'locacao', 'locado', COALESCE(v_status_loc, v_status_disp), '30150170', 'Av. do Contorno', '4800', 'Funcionários', 'Belo Horizonte', 'MG', 1, 0, 1, 0, 28, 30, NULL, 1500, 350, 120, 'Studio já locado — renda garantida.', ARRAY['Mobiliado'], false, false, false, true, false, 'imobiliaria', 5, NOW() - INTERVAL '8 days', NOW()),
    (v_imovel_ids[19], v_corretor_id, '0019', 'Sala comercial Castelo', 'sala-comercial-castelo-seed-0019', 'comercial', 'locacao', 'disponivel', v_status_disp, '31330340', 'Av. Barão Homem de Melo', '2100', 'Castelo', 'Belo Horizonte', 'MG', 0, 0, 1, 1, 65, 65, NULL, 4200, 600, 380, 'Sala comercial em prédio A.', ARRAY['Elevador'], true, false, false, false, false, 'portaria', 7, NOW() - INTERVAL '5 days', NOW()),
    (v_imovel_ids[20], v_corretor_id, '0020', 'Apartamento Sion família', 'apartamento-sion-familia-seed-0020', 'apartamento', 'venda', 'disponivel', v_status_disp, '30320000', 'Rua Alagoas', '890', 'Sion', 'Belo Horizonte', 'MG', 3, 1, 2, 2, 105, 118, 720000, NULL, 750, 2800, 'Apartamento familiar em condomínio.', ARRAY['Playground', 'Área de lazer', 'Portaria 24h'], true, true, true, false, true, 'portaria', 31, NOW() - INTERVAL '3 days', NOW())
  ON CONFLICT (corretor_id, codigo) DO NOTHING;

  -- ===========================================================================
  -- Fotos dos imóveis (2–4 por imóvel, ~60 registros)
  -- ===========================================================================
  INSERT INTO public.imovel_fotos (id, imovel_id, url, ordem, legenda) VALUES
    ('ff000000-0000-4000-a000-000000000001', v_imovel_ids[1],  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000002', v_imovel_ids[1],  'https://images.unsplash.com/photo-1522708323590-d24dbb4570a9?w=800&q=80', 2, 'Sala de estar'),
    ('ff000000-0000-4000-a000-000000000003', v_imovel_ids[1],  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', 3, 'Cozinha'),
    ('ff000000-0000-4000-a000-000000000004', v_imovel_ids[2],  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000005', v_imovel_ids[2],  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 2, 'Quintal'),
    ('ff000000-0000-4000-a000-000000000006', v_imovel_ids[2],  'https://images.unsplash.com/photo-1600210492486-724fe641c778?w=800&q=80', 3, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000007', v_imovel_ids[3],  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 1, 'Vista'),
    ('ff000000-0000-4000-a000-000000000008', v_imovel_ids[3],  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 2, 'Terraço'),
    ('ff000000-0000-4000-a000-000000000009', v_imovel_ids[3],  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', 3, 'Living'),
    ('ff000000-0000-4000-a000-000000000010', v_imovel_ids[3],  'https://images.unsplash.com/photo-1600566753190-17f410bce6b0?w=800&q=80', 4, 'Banheiro'),
    ('ff000000-0000-4000-a000-000000000011', v_imovel_ids[4],  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 1, 'Ambiente integrado'),
    ('ff000000-0000-4000-a000-000000000012', v_imovel_ids[4],  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 2, 'Cozinha compacta'),
    ('ff000000-0000-4000-a000-000000000013', v_imovel_ids[5],  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', 1, 'Recepção'),
    ('ff000000-0000-4000-a000-000000000014', v_imovel_ids[5],  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', 2, 'Sala'),
    ('ff000000-0000-4000-a000-000000000015', v_imovel_ids[6],  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000016', v_imovel_ids[6],  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 2, 'Piscina'),
    ('ff000000-0000-4000-a000-000000000017', v_imovel_ids[6],  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', 3, 'Sala de jantar'),
    ('ff000000-0000-4000-a000-000000000018', v_imovel_ids[7],  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000019', v_imovel_ids[7],  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9dd3?w=800&q=80', 2, 'Cozinha'),
    ('ff000000-0000-4000-a000-000000000020', v_imovel_ids[8],  'https://images.unsplash.com/photo-1600047509807-ba8f99d28c40?w=800&q=80', 1, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000021', v_imovel_ids[8],  'https://images.unsplash.com/photo-1600573472592-401b089b6d88?w=800&q=80', 2, 'Varanda'),
    ('ff000000-0000-4000-a000-000000000022', v_imovel_ids[9],  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80', 1, 'Terraço'),
    ('ff000000-0000-4000-a000-000000000023', v_imovel_ids[9],  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', 2, 'Living'),
    ('ff000000-0000-4000-a000-000000000024', v_imovel_ids[9],  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 3, 'Suíte'),
    ('ff000000-0000-4000-a000-000000000025', v_imovel_ids[10], 'https://images.unsplash.com/photo-1536376072261-38c8f6b54835?w=800&q=80', 1, 'Studio'),
    ('ff000000-0000-4000-a000-000000000026', v_imovel_ids[10], 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 2, 'Banheiro'),
    ('ff000000-0000-4000-a000-000000000027', v_imovel_ids[11], 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80', 1, 'Fachada comercial'),
    ('ff000000-0000-4000-a000-000000000028', v_imovel_ids[11], 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80', 2, 'Interior'),
    ('ff000000-0000-4000-a000-000000000029', v_imovel_ids[12], 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, 'Living'),
    ('ff000000-0000-4000-a000-000000000030', v_imovel_ids[12], 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80', 2, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000031', v_imovel_ids[13], 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000032', v_imovel_ids[13], 'https://images.unsplash.com/photo-1600566753086-00f18fb576b9?w=800&q=80', 2, 'Piscina'),
    ('ff000000-0000-4000-a000-000000000033', v_imovel_ids[13], 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', 3, 'Churrasqueira'),
    ('ff000000-0000-4000-a000-000000000034', v_imovel_ids[14], 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 1, 'Sala'),
    ('ff000000-0000-4000-a000-000000000035', v_imovel_ids[14], 'https://images.unsplash.com/photo-1600210492486-724fe641c778?w=800&q=80', 2, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000036', v_imovel_ids[15], 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 1, 'Vista'),
    ('ff000000-0000-4000-a000-000000000037', v_imovel_ids[15], 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', 2, 'Living'),
    ('ff000000-0000-4000-a000-000000000038', v_imovel_ids[15], 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 3, 'Terraço'),
    ('ff000000-0000-4000-a000-000000000039', v_imovel_ids[16], 'https://images.unsplash.com/photo-1600573472592-401b089b6d88?w=800&q=80', 1, 'Varanda'),
    ('ff000000-0000-4000-a000-000000000040', v_imovel_ids[16], 'https://images.unsplash.com/photo-1600047509807-ba8f99d28c40?w=800&q=80', 2, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000041', v_imovel_ids[17], 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000042', v_imovel_ids[17], 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9dd3?w=800&q=80', 2, 'Cozinha'),
    ('ff000000-0000-4000-a000-000000000043', v_imovel_ids[17], 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80', 3, 'Quarto'),
    ('ff000000-0000-4000-a000-000000000044', v_imovel_ids[18], 'https://images.unsplash.com/photo-1536376072261-38c8f6b54835?w=800&q=80', 1, 'Studio'),
    ('ff000000-0000-4000-a000-000000000045', v_imovel_ids[18], 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 2, 'Banheiro'),
    ('ff000000-0000-4000-a000-000000000046', v_imovel_ids[19], 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', 1, 'Sala comercial'),
    ('ff000000-0000-4000-a000-000000000047', v_imovel_ids[19], 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80', 2, 'Escritório'),
    ('ff000000-0000-4000-a000-000000000048', v_imovel_ids[20], 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', 1, 'Fachada'),
    ('ff000000-0000-4000-a000-000000000049', v_imovel_ids[20], 'https://images.unsplash.com/photo-1522708323590-d24dbb4570a9?w=800&q=80', 2, 'Sala'),
    ('ff000000-0000-4000-a000-000000000050', v_imovel_ids[20], 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', 3, 'Cozinha'),
    ('ff000000-0000-4000-a000-000000000051', v_imovel_ids[20], 'https://images.unsplash.com/photo-1600210492486-724fe641c778?w=800&q=80', 4, 'Quarto')
  ON CONFLICT (id) DO NOTHING;

  -- ===========================================================================
  -- 30 leads (funil distribuído, criado_em nos últimos 60 dias)
  -- ===========================================================================
  INSERT INTO public.leads (
    id, corretor_id, nome, telefone, email,
    finalidade_busca, tipo_imovel_busca, bairros_interesse,
    quartos_minimo, valor_minimo, valor_maximo, prazo_decisao,
    etapa, temperatura, origem, atendido_por, criado_em, atualizado_em
  ) VALUES
    (v_lead_ids[1],  v_corretor_id, 'Ana Carolina Mendes',    '31998765432', 'ana.mendes@gmail.com',       'compra', 'apartamento', ARRAY['Savassi', 'Funcionários'], 2, 400000, 700000, '3 meses', 'novo',            'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '58 days', NOW()),
    (v_lead_ids[2],  v_corretor_id, 'Bruno Henrique Souza',   '31987654321', 'bruno.souza@outlook.com',    'compra', 'casa',        ARRAY['Pampulha', 'Santa Amélia'], 3, 700000, 1200000, '6 meses', 'novo',            'morno',   'Instagram orgânico', 'corretor', NOW() - INTERVAL '56 days', NOW()),
    (v_lead_ids[3],  v_corretor_id, 'Camila Rodrigues Lima',  '31976543210', 'camila.lima@yahoo.com.br',   'locacao', 'apartamento', ARRAY['Lourdes', 'Savassi'], 2, 2500, 5000, '1 mês', 'novo',            'quente',  'Site',               'corretor', NOW() - INTERVAL '54 days', NOW()),
    (v_lead_ids[4],  v_corretor_id, 'Daniel Oliveira Costa',  '31965432109', 'daniel.costa@gmail.com',     'compra', 'cobertura',   ARRAY['Belvedere', 'Gutierrez'], 3, 1200000, 2000000, '4 meses', 'novo',            'frio',    'Indicação',          'corretor', NOW() - INTERVAL '52 days', NOW()),
    (v_lead_ids[5],  v_corretor_id, 'Eduarda Ferreira Alves', '31954321098', 'eduarda.alves@hotmail.com',  'locacao', 'studio',      ARRAY['Funcionários', 'Sion'], 1, 1500, 2500, '15 dias', 'novo',            'morno',   'WhatsApp',           'corretor', NOW() - INTERVAL '50 days', NOW()),
    (v_lead_ids[6],  v_corretor_id, 'Felipe Augusto Ribeiro', '31943210987', 'felipe.ribeiro@gmail.com',   'compra', 'apartamento', ARRAY['Buritis', 'Castelo'], 2, 350000, 550000, '2 meses', 'contato_feito',   'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '48 days', NOW()),
    (v_lead_ids[7],  v_corretor_id, 'Gabriela Martins Silva', '31932109876', 'gabriela.silva@outlook.com', 'compra', 'casa',        ARRAY['Gutierrez', 'Sion'], 3, 800000, 1000000, '5 meses', 'contato_feito',   'morno',   'Site',               'corretor', NOW() - INTERVAL '46 days', NOW()),
    (v_lead_ids[8],  v_corretor_id, 'Henrique Barbosa Nunes', '31921098765', 'henrique.nunes@gmail.com',   'locacao', 'apartamento', ARRAY['Lourdes'], 3, 4000, 6000, '1 mês', 'contato_feito',   'quente',  'WhatsApp',           'corretor', NOW() - INTERVAL '44 days', NOW()),
    (v_lead_ids[9],  v_corretor_id, 'Isabela Castro Pinto',   '31910987654', 'isabela.pinto@yahoo.com.br', 'compra', 'apartamento', ARRAY['Savassi'], 2, 500000, 650000, '3 meses', 'contato_feito',   'frio',    'Instagram orgânico', 'corretor', NOW() - INTERVAL '42 days', NOW()),
    (v_lead_ids[10], v_corretor_id, 'João Pedro Teixeira',    '31999887766', 'joao.teixeira@gmail.com',    'compra', 'comercial',   ARRAY['Funcionários'], 0, 800000, 1100000, '6 meses', 'contato_feito',   'morno',   'manual',             'corretor', NOW() - INTERVAL '40 days', NOW()),
    (v_lead_ids[11], v_corretor_id, 'Karina Duarte Santos',   '31988776655', 'karina.santos@hotmail.com',  'compra', 'apartamento', ARRAY['Savassi', 'Lourdes'], 3, 600000, 900000, '2 meses', 'qualificado',     'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '38 days', NOW()),
    (v_lead_ids[12], v_corretor_id, 'Lucas Andrade Pereira',  '31977665544', 'lucas.pereira@gmail.com',    'locacao', 'casa',        ARRAY['Pampulha', 'Santa Amélia'], 3, 2800, 4000, '1 mês', 'qualificado',     'morno',   'Indicação',          'corretor', NOW() - INTERVAL '36 days', NOW()),
    (v_lead_ids[13], v_corretor_id, 'Mariana Gomes Vieira',   '31966554433', 'mariana.vieira@outlook.com', 'compra', 'cobertura',   ARRAY['Belvedere'], 4, 1500000, 2200000, '4 meses', 'qualificado',     'quente',  'Site',               'corretor', NOW() - INTERVAL '34 days', NOW()),
    (v_lead_ids[14], v_corretor_id, 'Nicolas Ramos Freitas',  '31955443322', 'nicolas.freitas@gmail.com',  'compra', 'apartamento', ARRAY['Buritis', 'Castelo'], 2, 380000, 480000, '2 meses', 'qualificado',     'frio',    'WhatsApp',           'corretor', NOW() - INTERVAL '32 days', NOW()),
    (v_lead_ids[15], v_corretor_id, 'Olivia Moura Cardoso',   '31944332211', 'olivia.cardoso@yahoo.com.br','locacao', 'studio',      ARRAY['Sion', 'Funcionários'], 1, 1600, 2200, '20 dias', 'qualificado',     'morno',   'Instagram orgânico', 'corretor', NOW() - INTERVAL '30 days', NOW()),
    (v_lead_ids[16], v_corretor_id, 'Paulo Sérgio Araújo',    '31933221100', 'paulo.araujo@gmail.com',     'compra', 'apartamento', ARRAY['Savassi'], 3, 650000, 750000, '1 mês', 'visita_agendada', 'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '28 days', NOW()),
    (v_lead_ids[17], v_corretor_id, 'Renata Cunha Dias',      '31922110099', 'renata.dias@hotmail.com',    'compra', 'casa',        ARRAY['Pampulha'], 4, 1000000, 1400000, '3 meses', 'visita_agendada', 'quente',  'Indicação',          'corretor', NOW() - INTERVAL '26 days', NOW()),
    (v_lead_ids[18], v_corretor_id, 'Samuel Prado Melo',      '31911009988', 'samuel.melo@outlook.com',    'locacao', 'apartamento', ARRAY['Lourdes', 'Belvedere'], 3, 4500, 8000, '1 mês', 'visita_agendada', 'morno',   'Site',               'corretor', NOW() - INTERVAL '24 days', NOW()),
    (v_lead_ids[19], v_corretor_id, 'Tatiana Borges Reis',    '31900998877', 'tatiana.reis@gmail.com',     'compra', 'apartamento', ARRAY['Gutierrez', 'Sion'], 2, 700000, 850000, '2 meses', 'visita_agendada', 'frio',    'WhatsApp',           'corretor', NOW() - INTERVAL '22 days', NOW()),
    (v_lead_ids[20], v_corretor_id, 'Ubiratan Lopes Neto',    '31998877665', 'ubiratan.neto@yahoo.com.br', 'compra', 'cobertura',   ARRAY['Gutierrez'], 3, 1600000, 1900000, '5 meses', 'proposta',        'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '20 days', NOW()),
    (v_lead_ids[21], v_corretor_id, 'Valéria Nascimento',     '31987766554', 'valeria.nascimento@gmail.com','compra', 'apartamento', ARRAY['Savassi', 'Buritis'], 2, 500000, 600000, '1 mês', 'proposta',        'quente',  'Site',               'corretor', NOW() - INTERVAL '18 days', NOW()),
    (v_lead_ids[22], v_corretor_id, 'Wagner Campos Rocha',    '31976655443', 'wagner.rocha@hotmail.com',   'compra', 'casa',        ARRAY['Belvedere'], 5, 2000000, 2600000, '6 meses', 'proposta',        'morno',   'Indicação',          'corretor', NOW() - INTERVAL '16 days', NOW()),
    (v_lead_ids[23], v_corretor_id, 'Xavier Monteiro Paiva',  '31965544332', 'xavier.paiva@gmail.com',     'locacao', 'comercial',   ARRAY['Castelo', 'Funcionários'], 0, 4000, 6000, '1 mês', 'proposta',        'frio',    'manual',             'corretor', NOW() - INTERVAL '14 days', NOW()),
    (v_lead_ids[24], v_corretor_id, 'Yasmin Correia Azevedo', '31954433221', 'yasmin.azevedo@outlook.com', 'compra', 'apartamento', ARRAY['Sion'], 3, 700000, 750000, 'fechado', 'fechado',         'quente',  'Meta Ads',           'corretor', NOW() - INTERVAL '12 days', NOW()),
    (v_lead_ids[25], v_corretor_id, 'Zeca Pagodinho Silva',   '31943322110', 'zeca.silva@yahoo.com.br',    'compra', 'casa',        ARRAY['Pampulha'], 4, 1200000, 1300000, 'fechado', 'fechado',         'quente',  'Indicação',          'corretor', NOW() - INTERVAL '10 days', NOW()),
    (v_lead_ids[26], v_corretor_id, 'Amanda Beatriz Torres',  '31932211009', 'amanda.torres@gmail.com',    'compra', 'apartamento', ARRAY['Castelo'], 2, 400000, 450000, 'fechado', 'fechado',         'morno',   'WhatsApp',           'corretor', NOW() - INTERVAL '8 days', NOW()),
    (v_lead_ids[27], v_corretor_id, 'Bernardo Almeida Cruz',  '31921100998', 'bernardo.cruz@hotmail.com',  'compra', 'apartamento', ARRAY['Savassi'], 2, 600000, 700000, 'perdido', 'perdido',         'frio',    'Meta Ads',           'corretor', NOW() - INTERVAL '35 days', NOW()),
    (v_lead_ids[28], v_corretor_id, 'Carla Regina Pires',     '31910099887', 'carla.pires@gmail.com',      'locacao', 'apartamento', ARRAY['Lourdes'], 2, 3000, 4500, 'perdido', 'perdido',         'frio',    'Site',               'corretor', NOW() - INTERVAL '33 days', NOW()),
    (v_lead_ids[29], v_corretor_id, 'Diego Henrique Moura',   '31909988776', 'diego.moura@outlook.com',    'compra', 'cobertura',   ARRAY['Belvedere'], 4, 1800000, 2500000, 'perdido', 'perdido',         'morno',   'Instagram orgânico', 'corretor', NOW() - INTERVAL '31 days', NOW()),
    (v_lead_ids[30], v_corretor_id, 'Eliane Souza Braga',     '31998877664', 'eliane.braga@yahoo.com.br',  'compra', 'casa',        ARRAY['Gutierrez'], 3, 900000, 950000, 'perdido', 'perdido',         'frio',    'manual',             'corretor', NOW() - INTERVAL '29 days', NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Interações de exemplo (enriquece atendimentos)
  INSERT INTO public.lead_interacoes (id, lead_id, corretor_id, tipo, conteudo, de, criado_em) VALUES
    ('a1000000-0000-4000-a000-000000000001', v_lead_ids[6],  v_corretor_id, 'ligacao',        'Primeiro contato — lead interessado em apartamento no Buritis.', 'corretor', NOW() - INTERVAL '47 days'),
    ('a1000000-0000-4000-a000-000000000002', v_lead_ids[11], v_corretor_id, 'mensagem_whatsapp', 'Enviado portfólio de 3 imóveis em Savassi.', 'corretor', NOW() - INTERVAL '37 days'),
    ('a1000000-0000-4000-a000-000000000003', v_lead_ids[16], v_corretor_id, 'visita',         'Visita agendada ao apto 0001 Savassi.', 'corretor', NOW() - INTERVAL '27 days'),
    ('a1000000-0000-4000-a000-000000000004', v_lead_ids[20], v_corretor_id, 'proposta',       'Proposta verbal de R$ 1.580.000 na cobertura Gutierrez.', 'corretor', NOW() - INTERVAL '19 days'),
    ('a1000000-0000-4000-a000-000000000005', v_lead_ids[24], v_corretor_id, 'email',          'Contrato de compra e venda assinado.', 'corretor', NOW() - INTERVAL '11 days'),
    ('a1000000-0000-4000-a000-000000000006', v_lead_ids[1],  v_corretor_id, 'mensagem_whatsapp', 'Lead respondeu anúncio Meta Ads.', 'lead', NOW() - INTERVAL '57 days'),
    ('a1000000-0000-4000-a000-000000000007', v_lead_ids[13], v_corretor_id, 'anotacao',       'Lead qualificado — perfil investidor alto padrão.', 'corretor', NOW() - INTERVAL '33 days'),
    ('a1000000-0000-4000-a000-000000000008', v_lead_ids[27], v_corretor_id, 'ligacao',        'Lead optou por outra imobiliária.', 'corretor', NOW() - INTERVAL '34 days')
  ON CONFLICT (id) DO NOTHING;

  -- ===========================================================================
  -- 10 visitas (jun/jul 2026)
  -- ===========================================================================
  INSERT INTO public.visitas (
    id, corretor_id, lead_id, imovel_id, data_visita, status, parecer, vai_gerar_proposta, observacoes, criado_em
  ) VALUES
    (v_visita_ids[1], v_corretor_id, v_lead_ids[16], v_imovel_ids[1],  '2026-06-05 10:00:00-03', 'realizada', 'positivo', true,  'Gostou da localização e do apartamento.', NOW() - INTERVAL '27 days'),
    (v_visita_ids[2], v_corretor_id, v_lead_ids[17], v_imovel_ids[13], '2026-06-12 14:30:00-03', 'realizada', 'neutro',   NULL,  'Achou a casa grande demais.', NOW() - INTERVAL '25 days'),
    (v_visita_ids[3], v_corretor_id, v_lead_ids[18], v_imovel_ids[15], '2026-06-18 09:00:00-03', 'realizada', 'negativo', false, 'Valor do condomínio acima do orçamento.', NOW() - INTERVAL '23 days'),
    (v_visita_ids[4], v_corretor_id, v_lead_ids[19], v_imovel_ids[17], '2026-06-22 16:00:00-03', 'cancelada', NULL,       NULL,    'Lead cancelou por imprevisto.', NOW() - INTERVAL '21 days'),
    (v_visita_ids[5], v_corretor_id, v_lead_ids[20], v_imovel_ids[9],  '2026-06-25 11:00:00-03', 'realizada', 'positivo', true,  'Encantado com a cobertura.', NOW() - INTERVAL '19 days'),
    (v_visita_ids[6], v_corretor_id, v_lead_ids[21], v_imovel_ids[14], '2026-06-28 15:30:00-03', 'realizada', 'positivo', true,  'Quer fazer proposta.', NOW() - INTERVAL '17 days'),
    (v_visita_ids[7], v_corretor_id, v_lead_ids[11], v_imovel_ids[3],  '2026-07-03 10:30:00-03', 'agendada',  NULL,       NULL,    'Visita confirmada por WhatsApp.', NOW() - INTERVAL '5 days'),
    (v_visita_ids[8], v_corretor_id, v_lead_ids[6],  v_imovel_ids[16], '2026-07-08 14:00:00-03', 'agendada',  NULL,       NULL,    'Aguardando confirmação final.', NOW() - INTERVAL '3 days'),
    (v_visita_ids[9], v_corretor_id, v_lead_ids[13], v_imovel_ids[6],  '2026-07-12 09:30:00-03', 'agendada',  NULL,       NULL,    'Visita mansão Belvedere.', NOW() - INTERVAL '2 days'),
    (v_visita_ids[10], v_corretor_id, v_lead_ids[8], v_imovel_ids[12], '2026-07-15 17:00:00-03', 'nao_compareceu', NULL,  NULL,    'Lead não compareceu.', NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- ===========================================================================
  -- 8 propostas
  -- ===========================================================================
  INSERT INTO public.propostas (
    id, corretor_id, lead_id, imovel_id, valor_proposto, data_proposta, status, observacoes, criado_em
  ) VALUES
    (v_proposta_ids[1], v_corretor_id, v_lead_ids[20], v_imovel_ids[9],  1580000.00, '2026-06-26', 'em_analise',     'Proposta 5% abaixo do pedido.', NOW() - INTERVAL '18 days'),
    (v_proposta_ids[2], v_corretor_id, v_lead_ids[21], v_imovel_ids[14], 530000.00,  '2026-06-29', 'contraproposta', 'Proprietário contra-proposta R$ 540k.', NOW() - INTERVAL '16 days'),
    (v_proposta_ids[3], v_corretor_id, v_lead_ids[22], v_imovel_ids[6],  2350000.00, '2026-06-20', 'recusada',       'Proprietário recusou valor.', NOW() - INTERVAL '15 days'),
    (v_proposta_ids[4], v_corretor_id, v_lead_ids[16], v_imovel_ids[1],  660000.00,  '2026-07-01', 'em_analise',     'Aguardando resposta do vendedor.', NOW() - INTERVAL '10 days'),
    (v_proposta_ids[5], v_corretor_id, v_lead_ids[23], v_imovel_ids[19], 4000.00,    '2026-07-02', 'cancelada',      'Lead desistiu da locação comercial.', NOW() - INTERVAL '8 days'),
    (v_proposta_ids[6], v_corretor_id, v_lead_ids[24], v_imovel_ids[20], 710000.00,  '2026-06-15', 'aceita',         'Proposta aceita — apto Sion.', NOW() - INTERVAL '12 days'),
    (v_proposta_ids[7], v_corretor_id, v_lead_ids[25], v_imovel_ids[13], 1230000.00, '2026-06-18', 'aceita',         'Proposta aceita — casa Pampulha.', NOW() - INTERVAL '10 days'),
    (v_proposta_ids[8], v_corretor_id, v_lead_ids[26], v_imovel_ids[8],  410000.00,  '2026-06-22', 'aceita',         'Proposta aceita — apto Castelo.', NOW() - INTERVAL '8 days')
  ON CONFLICT (id) DO NOTHING;

  -- ===========================================================================
  -- 3 negócios (comissão 3%)
  -- ===========================================================================
  INSERT INTO public.negocios (
    id, corretor_id, lead_id, imovel_id, proposta_id,
    valor_fechamento, valor_comissao, percentual_comissao,
    data_fechamento, data_prevista_comissao, data_recebimento_comissao,
    forma_pagamento, status, observacoes, criado_em
  ) VALUES
    (v_negocio_ids[1], v_corretor_id, v_lead_ids[24], v_imovel_ids[20], v_proposta_ids[6],
     710000.00, 21300.00, 3.00, '2026-06-20', '2026-07-20', '2026-07-01',
     'financiamento', 'fechado', 'Comissão recebida.', NOW() - INTERVAL '11 days'),
    (v_negocio_ids[2], v_corretor_id, v_lead_ids[25], v_imovel_ids[13], v_proposta_ids[7],
     1230000.00, 36900.00, 3.00, '2026-06-22', '2026-07-22', NULL,
     'avista', 'fechado', 'Aguardando recebimento da comissão.', NOW() - INTERVAL '9 days'),
    (v_negocio_ids[3], v_corretor_id, v_lead_ids[26], v_imovel_ids[8], v_proposta_ids[8],
     410000.00, 12300.00, 3.00, '2026-06-25', '2026-07-25', NULL,
     'financiamento', 'fechado', 'Escritura agendada.', NOW() - INTERVAL '7 days')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.leads
  SET etapa = 'fechado', atualizado_em = NOW()
  WHERE id IN (v_lead_ids[24], v_lead_ids[25], v_lead_ids[26])
    AND corretor_id = v_corretor_id;

  -- ===========================================================================
  -- 20 itens de agenda (jun/jul 2026)
  -- ===========================================================================
  INSERT INTO public.agenda (
    id, corretor_id, lead_id, imovel_id, visita_id,
    tipo, titulo, descricao, data_atividade, status, lembrete_email, lembrete_enviado, criado_em
  ) VALUES
    (v_agenda_ids[1],  v_corretor_id, v_lead_ids[16], v_imovel_ids[1],  v_visita_ids[1],  'visita',   'Visita apto Savassi',           'Acompanhar visita presencial.',           '2026-06-05 09:45:00-03', 'concluida', true,  true,  NOW() - INTERVAL '27 days'),
    (v_agenda_ids[2],  v_corretor_id, v_lead_ids[17], v_imovel_ids[13], v_visita_ids[2],  'visita',   'Visita casa Pampulha',          'Apresentar casa com piscina.',            '2026-06-12 14:00:00-03', 'concluida', false, false, NOW() - INTERVAL '25 days'),
    (v_agenda_ids[3],  v_corretor_id, v_lead_ids[6],  NULL,             NULL,             'ligacao',  'Retorno lead Felipe',           'Ligar sobre apto Buritis.',               '2026-06-08 11:00:00-03', 'concluida', false, false, NOW() - INTERVAL '40 days'),
    (v_agenda_ids[4],  v_corretor_id, v_lead_ids[11], NULL,             NULL,             'tarefa',   'Enviar e-mail portfólio',       'Enviar 3 opções em Savassi por e-mail.',  '2026-06-10 09:00:00-03', 'concluida', true,  true,  NOW() - INTERVAL '38 days'),
    (v_agenda_ids[5],  v_corretor_id, v_lead_ids[1],  NULL,             NULL,             'lembrete', 'Follow-up WhatsApp Ana',        'Responder dúvidas sobre financiamento.',  '2026-06-14 16:00:00-03', 'concluida', false, false, NOW() - INTERVAL '35 days'),
    (v_agenda_ids[6],  v_corretor_id, v_lead_ids[20], v_imovel_ids[9],  NULL,             'reuniao',  'Reunião proposta cobertura',    'Alinhar proposta com proprietário.',      '2026-06-26 10:00:00-03', 'concluida', true,  true,  NOW() - INTERVAL '18 days'),
    (v_agenda_ids[7],  v_corretor_id, v_lead_ids[24], v_imovel_ids[20], NULL,             'reuniao',  'Assinatura contrato Sion',      'Assinatura na imobiliária.',              '2026-06-20 14:30:00-03', 'concluida', true,  true,  NOW() - INTERVAL '11 days'),
    (v_agenda_ids[8],  v_corretor_id, v_lead_ids[13], v_imovel_ids[6],  v_visita_ids[9],  'visita',   'Visita mansão Belvedere',       'Tour com lead investidor.',               '2026-07-12 09:00:00-03', 'pendente',  true,  false, NOW() - INTERVAL '2 days'),
    (v_agenda_ids[9],  v_corretor_id, v_lead_ids[11], v_imovel_ids[3],  v_visita_ids[7],  'visita',   'Visita cobertura Lourdes',      'Lead Karina — cobertura reservada.',      '2026-07-03 10:00:00-03', 'pendente',  true,  false, NOW() - INTERVAL '5 days'),
    (v_agenda_ids[10], v_corretor_id, v_lead_ids[6],  v_imovel_ids[16], v_visita_ids[8],  'visita',   'Visita apto Buritis',           'Felipe — apto 2 quartos.',                '2026-07-08 13:30:00-03', 'pendente',  false, false, NOW() - INTERVAL '3 days'),
    (v_agenda_ids[11], v_corretor_id, v_lead_ids[3],  NULL,             NULL,             'ligacao',  'Ligar Camila — locação',        'Confirmar interesse Lourdes.',            '2026-07-05 10:00:00-03', 'pendente',  false, false, NOW() - INTERVAL '4 days'),
    (v_agenda_ids[12], v_corretor_id, v_lead_ids[21], v_imovel_ids[14], NULL,             'tarefa',   'Enviar contra-proposta e-mail', 'Encaminhar resposta do proprietário.',    '2026-07-06 09:30:00-03', 'pendente',  true,  false, NOW() - INTERVAL '3 days'),
    (v_agenda_ids[13], v_corretor_id, v_lead_ids[5],  NULL,             NULL,             'lembrete', 'WhatsApp Eduarda studio',       'Enviar opções studio Funcionários.',      '2026-07-07 15:00:00-03', 'pendente',  false, false, NOW() - INTERVAL '2 days'),
    (v_agenda_ids[14], v_corretor_id, v_lead_ids[16], v_imovel_ids[1],  NULL,             'tarefa',   'Follow-up proposta Savassi',    'Cobrar retorno do vendedor.',             '2026-07-10 11:00:00-03', 'pendente',  true,  false, NOW() - INTERVAL '1 day'),
    (v_agenda_ids[15], v_corretor_id, v_lead_ids[25], v_imovel_ids[13], NULL,             'reuniao',  'Vistoria casa Pampulha',        'Vistoria pré-escritura.',                 '2026-07-14 08:30:00-03', 'pendente',  true,  false, NOW()),
    (v_agenda_ids[16], v_corretor_id, v_lead_ids[2],  NULL,             NULL,             'ligacao',  'Contato Bruno — casa Pampulha', 'Primeiro contato pós formulário.',        '2026-07-16 10:00:00-03', 'pendente',  false, false, NOW()),
    (v_agenda_ids[17], v_corretor_id, v_lead_ids[8],  v_imovel_ids[12], v_visita_ids[10], 'visita',   'Reagendar visita Lourdes',      'Lead Henrique — locação premium.',        '2026-07-18 16:00:00-03', 'cancelada', false, false, NOW()),
    (v_agenda_ids[18], v_corretor_id, NULL,           NULL,             NULL,             'outro',    'Atualizar fotos imóveis',       'Revisar fotos Unsplash nos imóveis seed.', '2026-07-20 09:00:00-03', 'pendente',  false, false, NOW()),
    (v_agenda_ids[19], v_corretor_id, v_lead_ids[4],  NULL,             NULL,             'reuniao',  'Apresentação investidor',       'Daniel — coberturas alto padrão.',        '2026-07-22 14:00:00-03', 'pendente',  true,  false, NOW()),
    (v_agenda_ids[20], v_corretor_id, v_lead_ids[10], v_imovel_ids[11], NULL,             'visita',   'Visita loja Funcionários',      'João Pedro — ponto comercial.',           '2026-07-25 11:30:00-03', 'pendente',  true,  false, NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed concluído para corretor_id=%', v_corretor_id;
END $$;

-- Passo 3: conferir contagens
SELECT 'imoveis' AS tabela, COUNT(*) AS total
FROM public.imoveis WHERE codigo BETWEEN '0001' AND '0020'
UNION ALL
SELECT 'imovel_fotos', COUNT(*) FROM public.imovel_fotos WHERE id::text LIKE 'ff000000-%'
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads WHERE id::text LIKE 'b0000000-%'
UNION ALL
SELECT 'lead_interacoes', COUNT(*) FROM public.lead_interacoes WHERE id::text LIKE 'a1000000-%'
UNION ALL
SELECT 'visitas', COUNT(*) FROM public.visitas WHERE id::text LIKE 'c0000000-%'
UNION ALL
SELECT 'propostas', COUNT(*) FROM public.propostas WHERE id::text LIKE 'd0000000-%'
UNION ALL
SELECT 'negocios', COUNT(*) FROM public.negocios WHERE id::text LIKE 'e0000000-%'
UNION ALL
SELECT 'agenda', COUNT(*) FROM public.agenda WHERE id::text LIKE 'f0000000-%';
