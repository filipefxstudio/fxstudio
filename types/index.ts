export type PlanoAssinatura = "basico" | "profissional" | "premium";

export type StatusAssinatura = "ativo" | "cancelado" | "pendente" | "expirado";

export type TipoImovel =
  | "apartamento"
  | "casa"
  | "terreno"
  | "comercial"
  | "cobertura"
  | "studio";

export type FinalidadeImovel = "venda" | "locacao";

export type StatusImovel = "disponivel" | "reservado" | "vendido" | "locado";

export type EtapaLead =
  | "novo"
  | "contato_feito"
  | "qualificado"
  | "visita_agendada"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido";

export type TemperaturaLead = "quente" | "morno" | "frio";

export type OrigemLead = "site" | "whatsapp" | "portal" | "indicacao" | "manual";

export type ProvedorIA = "openai" | "anthropic" | "gemini";

export type TomAgente = "profissional" | "descontraido" | "formal";

export type AtendidoPor = "chatbot" | "agente_ia" | "corretor";

export type EtapaChatbot =
  | "inicio"
  | "finalidade"
  | "bairro"
  | "quartos"
  | "valor"
  | "prazo"
  | "concluido";

export type TipoInteracao =
  | "mensagem_whatsapp"
  | "ligacao"
  | "visita"
  | "email"
  | "anotacao";

export type DeInteracao = "corretor" | "lead" | "bot" | "agente_ia";

export interface Corretor {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  creci: string | null;
  slug: string;
  dominio_custom?: string | null;
  foto_url?: string | null;
  sobre?: string | null;
  whatsapp?: string | null;
  zapi_instance_id?: string | null;
  zapi_token?: string | null;
  criado_em: string;
  atualizado_em?: string;
}

export interface Assinatura {
  id: string;
  corretor_id: string;
  plano: PlanoAssinatura;
  status: StatusAssinatura;
  criado_em: string;
}

export interface AgenteConfig {
  id: string;
  corretor_id: string;
  ativo: boolean;
  nome_agente: string;
  tom: TomAgente;
  provedor: ProvedorIA;
  modelo: string;
  api_key?: string;
  instrucoes_customizadas?: string | null;
  horario_inicio: string;
  horario_fim: string;
  agendar_visitas: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ImovelFoto {
  id: string;
  imovel_id: string;
  url: string;
  ordem: number;
  legenda?: string | null;
}

export interface Imovel {
  id: string;
  corretor_id: string;
  titulo?: string | null;
  slug?: string | null;
  tipo: TipoImovel;
  finalidade: FinalidadeImovel;
  status: StatusImovel;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area_util?: number | null;
  area_total?: number | null;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  valor_venda?: number | null;
  valor_locacao?: number | null;
  valor_condominio?: number | null;
  valor_iptu?: number | null;
  descricao?: string | null;
  diferenciais?: string[] | null;
  video_url?: string | null;
  publicado_site: boolean;
  fotos?: ImovelFoto[];
  visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Lead {
  id: string;
  corretor_id: string;
  imovel_id?: string | null;
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  finalidade_busca?: string | null;
  tipo_imovel_busca?: string | null;
  bairros_interesse?: string[] | null;
  quartos_minimo?: number | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  prazo_decisao?: string | null;
  etapa: EtapaLead;
  temperatura: TemperaturaLead;
  origem: OrigemLead;
  observacoes?: string | null;
  ultima_mensagem_em?: string | null;
  conversa_ativa?: boolean;
  etapa_chatbot?: EtapaChatbot | null;
  atendido_por: AtendidoPor;
  criado_em: string;
  atualizado_em: string;
  imovel?: Imovel;
  interacoes?: LeadInteracao[];
}

export interface LeadInteracao {
  id: string;
  lead_id: string;
  corretor_id: string;
  tipo: TipoInteracao;
  conteudo: string;
  de: DeInteracao;
  tokens_usados?: number | null;
  criado_em: string;
}

export interface RespostaAgente {
  texto: string;
  tokens_usados: number;
  provedor: ProvedorIA;
  modelo: string;
}

export interface CorretorInsert {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  creci: string | null;
  slug: string;
}

export interface AssinaturaInsert {
  corretor_id: string;
  plano: PlanoAssinatura;
  status: StatusAssinatura;
}

export interface CorretorComRelacoes extends Corretor {
  assinaturas?: Assinatura[];
  agente_config?: AgenteConfig | AgenteConfig[] | null;
}

export interface ZApiWebhookBody {
  phone?: string;
  instanceId?: string;
  text?: {
    message?: string;
  };
}
