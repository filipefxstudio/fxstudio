-- Remove orphan/duplicate config tables (superseded by canonical names).
-- midias_origem          -> midia_origem
-- motivos_desativacao_imovel -> motivos_desativacao
-- motivos_descarte_lead  -> motivos_descarte
-- These tables were never referenced in migrations or application code.
-- CASCADE drops any lingering policies, indexes, or FK constraints pointing to them.

DROP TABLE IF EXISTS public.midias_origem CASCADE;
DROP TABLE IF EXISTS public.motivos_desativacao_imovel CASCADE;
DROP TABLE IF EXISTS public.motivos_descarte_lead CASCADE;
