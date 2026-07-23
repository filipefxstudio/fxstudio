-- Prevenção de duplicidade — pessoas (clientes) e imóveis
-- Referência: Task 1 (já executada em produção). Não re-executar sem revisão.

-- Coluna usada pelo índice de endereço único
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS complemento_valor TEXT;

-- Vincular leads ao cadastro central de pessoas
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Índice único para telefone por conta
CREATE UNIQUE INDEX IF NOT EXISTS clientes_corretor_telefone_unique
  ON public.clientes (corretor_id, telefone)
  WHERE telefone IS NOT NULL AND telefone != '';

-- Índice único para email por conta
CREATE UNIQUE INDEX IF NOT EXISTS clientes_corretor_email_unique
  ON public.clientes (corretor_id, email)
  WHERE email IS NOT NULL AND email != '';

-- Índice único para imóveis por endereço completo
CREATE UNIQUE INDEX IF NOT EXISTS imoveis_endereco_unique
  ON public.imoveis (
    corretor_id,
    LOWER(TRIM(logradouro)),
    LOWER(TRIM(numero)),
    LOWER(TRIM(COALESCE(complemento_valor, '')))
  )
  WHERE logradouro IS NOT NULL AND numero IS NOT NULL;

-- Função para normalizar texto (remove acentos para comparação)
CREATE OR REPLACE FUNCTION public.normalizar_texto(texto TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      translate(texto,
        'àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ',
        'aaaaaaaceeeeiiiiðnooooouuuuyþyaaaaaaaceeeeiiiiðnooooouuuuyþ'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
