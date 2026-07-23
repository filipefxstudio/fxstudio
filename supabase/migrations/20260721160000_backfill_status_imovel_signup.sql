-- Backfill status_imovel padrão para corretores criados após as migrations de seed

INSERT INTO public.status_imovel (corretor_id, nome, cor, padrao, ativo, ordem)
SELECT c.id, s.nome, s.cor, s.padrao, s.ativo, s.ordem
FROM public.corretores c
CROSS JOIN (
  VALUES
    ('Em cadastro', '#94A3B8', false, true, -2),
    ('Aguardando aprovação', '#F59E0B', false, true, -1),
    ('Disponível', '#2DC653', true, true, 1),
    ('Reservado', '#F18F01', true, true, 2),
    ('Vendido', '#1E3A5F', true, true, 3),
    ('Locado', '#7C3AED', true, true, 4),
    ('Desativado', '#6B7280', false, true, 99)
) AS s(nome, cor, padrao, ativo, ordem)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.status_imovel si
  WHERE si.corretor_id = c.id
    AND si.nome = s.nome
);

-- Sincroniza imóveis em cadastro sem status_imovel vinculado
UPDATE public.imoveis i
SET
  status = 'em_cadastro',
  status_imovel_id = si.id
FROM public.status_imovel si
WHERE i.corretor_id = si.corretor_id
  AND si.nome = 'Em cadastro'
  AND i.status_aprovacao = 'em_cadastro'
  AND i.status_imovel_id IS NULL;

-- Sincroniza imóveis aguardando aprovação sem status_imovel vinculado
UPDATE public.imoveis i
SET
  status = 'aguardando_aprovacao',
  status_imovel_id = si.id
FROM public.status_imovel si
WHERE i.corretor_id = si.corretor_id
  AND si.nome = 'Aguardando aprovação'
  AND i.status_aprovacao = 'aguardando_aprovacao'
  AND i.status_imovel_id IS NULL;
