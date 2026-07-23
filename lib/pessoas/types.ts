export type MotivoDuplicidadePessoa = "telefone" | "email";

export type VerificacaoPessoaExistente = {
  existe: boolean;
  cliente?: {
    id: string;
    nome: string;
    telefone: string;
    email?: string | null;
    eh_construtor_investidor?: boolean;
    corretor_id?: string;
  };
  motivo?: MotivoDuplicidadePessoa;
};

export type PessoaAutocompleteItem = {
  /** ID do cadastro em `clientes`, quando existir. */
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  eh_construtor_investidor: boolean;
  /** Lead vinculado quando a correspondência veio de `leads`. */
  leadId?: string;
  origem?: "cliente" | "lead";
};

export type LeadAtivoInfo = {
  id: string;
  codigo_atendimento?: string | null;
  situacao?: string | null;
  etapa?: string | null;
  perfil_id?: string | null;
  perfil_nome?: string | null;
  descartado_em?: string | null;
  motivo_descarte?: string | null;
};

export type SelecaoPessoaAtendimentoResult = {
  tipo: "bloqueado" | "permitido" | "descartado";
  mensagem?: string;
  leadId?: string;
  cliente?: PessoaAutocompleteItem;
  atendimentoAnterior?: LeadAtivoInfo;
};

export type SelecaoPessoaProprietarioResult = {
  tipo: "bloqueado" | "permitido";
  mensagem?: string;
  cliente?: PessoaAutocompleteItem;
};
