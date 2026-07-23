-- Status operacionais do fluxo de cadastro/aprovação de imóveis

INSERT INTO public.status_imovel (corretor_id, nome, cor, padrao, ativo, ordem)
SELECT c.id, s.nome, s.cor, false, true, s.ordem
FROM public.corretores c
CROSS JOIN (
  VALUES
    ('Em cadastro', '#94A3B8', -2),
    ('Aguardando aprovação', '#F59E0B', -1)
) AS s(nome, cor, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.status_imovel si
  WHERE si.corretor_id = c.id AND si.nome = s.nome
);

-- Sincroniza imóveis em cadastro
UPDATE public.imoveis i
SET
  status = 'em_cadastro',
  status_imovel_id = si.id
FROM public.status_imovel si
WHERE i.corretor_id = si.corretor_id
  AND si.nome = 'Em cadastro'
  AND i.status_aprovacao = 'em_cadastro'
  AND (i.status IS DISTINCT FROM 'em_cadastro' OR i.status_imovel_id IS DISTINCT FROM si.id);

-- Sincroniza imóveis aguardando aprovação
UPDATE public.imoveis i
SET
  status = 'aguardando_aprovacao',
  status_imovel_id = si.id
FROM public.status_imovel si
WHERE i.corretor_id = si.corretor_id
  AND si.nome = 'Aguardando aprovação'
  AND i.status_aprovacao = 'aguardando_aprovacao'
  AND (i.status IS DISTINCT FROM 'aguardando_aprovacao' OR i.status_imovel_id IS DISTINCT FROM si.id);
