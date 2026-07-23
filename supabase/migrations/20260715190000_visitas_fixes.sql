-- Garante vai_gerar_proposta como VARCHAR (compatível com sim/nao/talvez do app)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visitas'
      AND column_name = 'vai_gerar_proposta'
      AND udt_name = 'bool'
  ) THEN
    ALTER TABLE public.visitas
      ALTER COLUMN vai_gerar_proposta TYPE VARCHAR(10)
      USING (
        CASE
          WHEN vai_gerar_proposta IS NULL THEN NULL
          WHEN vai_gerar_proposta = true THEN 'sim'
          WHEN vai_gerar_proposta = false THEN 'nao'
        END
      );
  END IF;
END $$;

-- Permite excluir visita sem bloquear por FK na agenda
ALTER TABLE public.agenda DROP CONSTRAINT IF EXISTS agenda_visita_id_fkey;

ALTER TABLE public.agenda
  ADD CONSTRAINT agenda_visita_id_fkey
  FOREIGN KEY (visita_id) REFERENCES public.visitas(id) ON DELETE SET NULL;
