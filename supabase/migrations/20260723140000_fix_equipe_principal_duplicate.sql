-- Corrige perfis que compartilham user_id do dono da conta sem ser o e-mail principal.
-- Ex.: convite com placeholder legado marcado ativo/admin indevidamente.

UPDATE public.perfis p
SET
  ativo = false,
  papel = CASE
    WHEN lower(trim(p.email)) = 'filipe.imobee@gmail.com' THEN 'corretor'
    WHEN p.papel = 'admin' THEN 'corretor'
    ELSE p.papel
  END
FROM public.corretores c
WHERE p.corretor_id = c.id
  AND p.user_id = c.user_id
  AND lower(trim(p.email)) <> lower(trim(c.email))
  AND p.ativo = true;

-- Convites pendentes legados (placeholder = user_id do dono): mantém inativo, corrige papel.
UPDATE public.perfis p
SET papel = 'corretor'
FROM public.corretores c
WHERE p.corretor_id = c.id
  AND p.user_id = c.user_id
  AND lower(trim(p.email)) <> lower(trim(c.email))
  AND p.ativo = false
  AND p.papel = 'admin';

-- Garante admin no perfil principal (dono da conta).
UPDATE public.perfis p
SET papel = 'admin'
FROM public.corretores c
WHERE p.corretor_id = c.id
  AND p.user_id = c.user_id
  AND lower(trim(p.email)) = lower(trim(c.email))
  AND p.ativo = true
  AND p.papel IS DISTINCT FROM 'admin';
