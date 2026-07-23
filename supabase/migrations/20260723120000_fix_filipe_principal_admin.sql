-- Principal account owners (perfil vinculado ao user_id do corretor) must be admin.
-- Backfill all owners; includes filipe.fxstudio@gmail.com and any other drift.

UPDATE public.perfis p
SET papel = 'admin'
FROM public.corretores c
WHERE p.corretor_id = c.id
  AND p.user_id = c.user_id
  AND p.ativo = true
  AND p.papel IS DISTINCT FROM 'admin';

-- Explicit fix for reported account (idempotent with backfill above).
UPDATE public.perfis
SET papel = 'admin'
WHERE email = 'filipe.fxstudio@gmail.com'
  AND ativo = true
  AND user_id IN (
    SELECT c.user_id
    FROM public.corretores c
    WHERE c.email = 'filipe.fxstudio@gmail.com'
  );

-- Remove duplicate pending invites (same email per tenant), keep oldest row.
DELETE FROM public.perfis p
USING (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY corretor_id, lower(trim(email))
      ORDER BY criado_em ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.perfis
  WHERE ativo = false
) dup
WHERE p.id = dup.id
  AND dup.rn > 1;
