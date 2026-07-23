-- FX Studio — etapa venda para negócios fechados (substitui fechado legado)

UPDATE public.leads
SET etapa = 'venda', atualizado_em = NOW()
WHERE etapa = 'fechado';

UPDATE public.leads
SET etapa = 'venda', situacao = 'negocio_fechado', atualizado_em = NOW()
WHERE situacao = 'negocio_fechado' AND etapa IS DISTINCT FROM 'venda';
