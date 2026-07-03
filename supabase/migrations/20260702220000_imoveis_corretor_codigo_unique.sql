-- Unique (corretor_id, codigo) for idempotent seed ON CONFLICT (corretor_id, codigo)
-- Replaces partial index imoveis_corretor_codigo_idx from 20260628140000_imoveis_codigo.sql

DROP INDEX IF EXISTS public.imoveis_corretor_codigo_idx;
ALTER TABLE public.imoveis DROP CONSTRAINT IF EXISTS imoveis_corretor_codigo_unique;

-- Reassign duplicate codigos per corretor (keep oldest row by criado_em, then id)
WITH ranked AS (
  SELECT
    id,
    corretor_id,
    ROW_NUMBER() OVER (
      PARTITION BY corretor_id, codigo
      ORDER BY criado_em NULLS LAST, id
    ) AS rn
  FROM public.imoveis
  WHERE codigo IS NOT NULL
),
to_fix AS (
  SELECT id, corretor_id
  FROM ranked
  WHERE rn > 1
),
max_codes AS (
  SELECT
    corretor_id,
    MAX(
      CASE
        WHEN codigo ~ '^\d+$' THEN codigo::integer
        ELSE 0
      END
    ) AS max_num
  FROM public.imoveis
  GROUP BY corretor_id
),
numbered AS (
  SELECT
    tf.id,
    tf.corretor_id,
    ROW_NUMBER() OVER (PARTITION BY tf.corretor_id ORDER BY tf.id) AS seq
  FROM to_fix tf
)
UPDATE public.imoveis AS i
SET codigo = LPAD((mc.max_num + n.seq)::text, 4, '0')
FROM numbered AS n
JOIN max_codes AS mc ON mc.corretor_id = n.corretor_id
WHERE i.id = n.id;

ALTER TABLE public.imoveis
  ADD CONSTRAINT imoveis_corretor_codigo_unique UNIQUE (corretor_id, codigo);
