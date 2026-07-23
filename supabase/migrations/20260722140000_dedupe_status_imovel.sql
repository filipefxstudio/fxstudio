-- Remove duplicatas em status_imovel (mesmo corretor_id + nome).
-- Duplicatas fazem maybeSingle() falhar com PGRST116 no createImovel.

DELETE FROM public.status_imovel AS si
WHERE si.id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY corretor_id, nome
        ORDER BY criado_em ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.status_imovel
  ) ranked
  WHERE rn > 1
);

-- Reforça unicidade (idempotente se a constraint da tabela já existir).
CREATE UNIQUE INDEX IF NOT EXISTS status_imovel_corretor_id_nome_uidx
  ON public.status_imovel (corretor_id, nome);
