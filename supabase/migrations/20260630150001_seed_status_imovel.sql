-- Seed status padrão para corretores existentes (Tarefa 7)

INSERT INTO public.status_imovel (corretor_id, nome, cor, padrao, ordem)
SELECT
  c.id,
  s.nome,
  s.cor,
  true,
  s.ordem
FROM public.corretores c
CROSS JOIN (
  VALUES
    ('Disponível', '#2DC653', 1),
    ('Reservado', '#F18F01', 2),
    ('Vendido', '#1E3A5F', 3),
    ('Locado', '#7C3AED', 4)
) AS s(nome, cor, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.status_imovel si WHERE si.corretor_id = c.id
);
