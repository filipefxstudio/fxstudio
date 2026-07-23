-- Backfill perfil admin for corretores created before signup flow inserted perfis
INSERT INTO public.perfis (corretor_id, user_id, nome, email, telefone, papel, ativo)
SELECT c.id, c.user_id, c.nome, c.email, c.telefone, 'admin', true
FROM public.corretores c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.perfis p
  WHERE p.corretor_id = c.id
    AND p.user_id = c.user_id
);
