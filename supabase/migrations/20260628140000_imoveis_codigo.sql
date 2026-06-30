-- Sequential property code per broker (0001, 0002, …)
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

-- Backfill existing rows ordered by criado_em per corretor
WITH numbered AS (
  SELECT
    id,
    LPAD(
      ROW_NUMBER() OVER (PARTITION BY corretor_id ORDER BY criado_em)::TEXT,
      4,
      '0'
    ) AS new_codigo
  FROM imoveis
  WHERE codigo IS NULL
)
UPDATE imoveis AS i
SET codigo = n.new_codigo
FROM numbered AS n
WHERE i.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS imoveis_corretor_codigo_idx
  ON imoveis (corretor_id, codigo)
  WHERE codigo IS NOT NULL;
