import { z } from "zod";

function coordNumber(message = "Coordenada inválida.") {
  return z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) {
        return null;
      }
      return Number(value);
    },
    z.number({ error: message }).nullable(),
  );
}

function optionalNumber(message = "Informe um número válido.") {
  return z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) {
        return null;
      }
      return Number(value);
    },
    z
      .number({ error: message })
      .min(0, "O valor não pode ser negativo.")
      .nullable(),
  );
}

function requiredInteger(message = "Informe um número válido.") {
  return z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) {
        return 0;
      }
      return Number(value);
    },
    z.number({ error: message }).int("Use um número inteiro.").min(0, "O valor não pode ser negativo."),
  );
}

const localChavesEnum = z.enum(["imobiliaria", "proprietario", "portaria", "outros"], {
  error: "Selecione o local das chaves.",
});

const baseImovelSchema = z.object({
  titulo: z.string().trim().min(3, "O título deve ter pelo menos 3 caracteres."),
  codigo_personalizado: z.string().trim().optional(),
  tipo: z.enum(
    ["apartamento", "casa", "terreno", "comercial", "cobertura", "studio"],
    { error: "Selecione o tipo do imóvel." },
  ),
  destinacao: z.enum(["residencial", "comercial", "rural"], {
    error: "Selecione a destinação.",
  }),
  finalidade: z.enum(["venda", "locacao"], {
    error: "Selecione a finalidade.",
  }),
  status: z.enum(["disponivel", "reservado", "vendido", "locado", "desativado"], {
    error: "Selecione o status.",
  }).optional(),
  status_imovel_id: z.string().uuid({ error: "Selecione o status." }),
  cep: z
    .string()
    .trim()
    .min(8, "Informe um CEP válido.")
    .max(9, "CEP inválido."),
  logradouro: z.string().trim().min(1, "Informe o logradouro."),
  numero: z.string().trim().min(1, "Informe o número."),
  complemento: z.string().trim().optional(),
  complemento_tipo: z.string().trim().optional(),
  complemento_numero: z.string().trim().optional(),
  complemento_torre: z.string().trim().optional(),
  condominio_nome: z.string().trim().optional(),
  bairro: z.string().trim().min(1, "Informe o bairro."),
  cidade: z.string().trim().min(1, "Informe a cidade."),
  estado: z
    .string()
    .trim()
    .length(2, "Informe a UF com 2 letras.")
    .transform((value) => value.toUpperCase()),
  latitude: coordNumber("Latitude inválida."),
  longitude: coordNumber("Longitude inválida."),
  portal_endereco_diferente: z.boolean(),
  portal_logradouro: z.string().trim().optional(),
  portal_numero: z.string().trim().optional(),
  portal_bairro: z.string().trim().optional(),
  portal_cep: z.string().trim().optional(),
  portal_cidade: z.string().trim().optional(),
  portal_estado: z.string().trim().optional(),
  local_chaves: localChavesEnum,
  chaves_codigo: z.string().trim().optional(),
  chaves_descricao: z.string().trim().optional(),
  exclusividade: z.boolean(),
  imovel_ocupado: z.boolean(),
  contrato_aluguel_ativo: z.boolean(),
  aceita_financiamento: z.boolean(),
  aceita_permuta: z.boolean(),
  imovel_na_planta: z.boolean(),
  area_util: optionalNumber("Área útil inválida."),
  area_total: optionalNumber("Área total inválida."),
  ano_construcao: optionalNumber("Ano de construção inválido."),
  quartos: requiredInteger(),
  suites: requiredInteger(),
  salas: requiredInteger(),
  banheiros: requiredInteger(),
  elevadores: requiredInteger(),
  vagas: requiredInteger(),
  vagas_tipo: z.string().trim().optional(),
  vagas_cobertura: z.string().trim().optional(),
  valor_venda: optionalNumber("Valor de venda inválido."),
  valor_locacao: optionalNumber("Valor de locação inválido."),
  valor_condominio: optionalNumber("Valor do condomínio inválido."),
  valor_iptu: optionalNumber("Valor do IPTU inválido."),
  comissao_percent: optionalNumber("Comissão inválida."),
  descricao: z.string().trim().optional(),
  diferenciais: z.array(z.string()),
  video_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || value.startsWith("http://") || value.startsWith("https://"),
      "Informe uma URL válida (http ou https).",
    ),
  publicado_site: z.boolean(),
  publicado_portais: z.boolean(),
  exibir_endereco_site: z.enum(["completo", "apenas_bairro", "oculto"]),
  exibir_endereco_portais: z.enum(["completo", "apenas_bairro", "oculto"]),
  cliente_id: z.string().uuid().optional().nullable(),
  captador_id: z.string().min(1, "Selecione o captador.").uuid("Selecione o captador."),
  proprietario_novo: z
    .object({
      nome: z.string().trim().min(2),
      telefone: z.string().trim().min(8),
      email: z.string().trim().optional(),
      tipo: z.enum(["proprietario", "ambos"]),
      eh_construtor_investidor: z.boolean(),
    })
    .optional()
    .nullable(),
});

export const imovelFormSchema = baseImovelSchema.superRefine((data, context) => {
  if (data.finalidade === "venda" && (data.valor_venda === null || data.valor_venda <= 0)) {
    context.addIssue({
      code: "custom",
      message: "Informe o valor de venda.",
      path: ["valor_venda"],
    });
  }

  if (data.finalidade === "locacao" && (data.valor_locacao === null || data.valor_locacao <= 0)) {
    context.addIssue({
      code: "custom",
      message: "Informe o valor de locação.",
      path: ["valor_locacao"],
    });
  }

  if (data.portal_endereco_diferente) {
    if (!data.portal_cep?.trim() || data.portal_cep.replace(/\D/g, "").length < 8) {
      context.addIssue({
        code: "custom",
        message: "Informe o CEP para portais.",
        path: ["portal_cep"],
      });
    }
    if (!data.portal_logradouro?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Informe o logradouro para portais.",
        path: ["portal_logradouro"],
      });
    }
    if (!data.portal_numero?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Informe o número para portais.",
        path: ["portal_numero"],
      });
    }
    if (!data.portal_bairro?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Informe o bairro para portais.",
        path: ["portal_bairro"],
      });
    }
    if (!data.portal_cidade?.trim()) {
      context.addIssue({
        code: "custom",
        message: "Informe a cidade para portais.",
        path: ["portal_cidade"],
      });
    }
    if (!data.portal_estado?.trim() || data.portal_estado.length !== 2) {
      context.addIssue({
        code: "custom",
        message: "Informe a UF para portais.",
        path: ["portal_estado"],
      });
    }
  }

  if (data.local_chaves === "imobiliaria" && !data.chaves_codigo?.trim()) {
    context.addIssue({
      code: "custom",
      message: "Informe o código/número da chave.",
      path: ["chaves_codigo"],
    });
  }

  if (data.local_chaves === "outros" && !data.chaves_descricao?.trim()) {
    context.addIssue({
      code: "custom",
      message: "Informe a descrição do local das chaves.",
      path: ["chaves_descricao"],
    });
  }

  if (!data.cliente_id && !data.proprietario_novo) {
    context.addIssue({
      code: "custom",
      message: "Vincule ou cadastre um proprietário.",
      path: ["cliente_id"],
    });
  }

  if (
    data.proprietario_novo &&
    data.proprietario_novo.eh_construtor_investidor === undefined
  ) {
    context.addIssue({
      code: "custom",
      message: "Informe se é construtor ou investidor.",
      path: ["proprietario_novo", "eh_construtor_investidor"],
    });
  }
});

export type ImovelFormValues = z.infer<typeof imovelFormSchema>;

export const imovelFormDefaultValues: ImovelFormValues = {
  titulo: "",
  codigo_personalizado: "",
  tipo: "apartamento",
  destinacao: "residencial",
  finalidade: "venda",
  status: "disponivel",
  status_imovel_id: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  complemento_tipo: "",
  complemento_numero: "",
  complemento_torre: "",
  condominio_nome: "",
  bairro: "",
  cidade: "",
  estado: "",
  latitude: null,
  longitude: null,
  portal_endereco_diferente: false,
  portal_logradouro: "",
  portal_numero: "",
  portal_bairro: "",
  portal_cep: "",
  portal_cidade: "",
  portal_estado: "",
  local_chaves: "imobiliaria",
  chaves_codigo: "",
  chaves_descricao: "",
  exclusividade: false,
  imovel_ocupado: false,
  contrato_aluguel_ativo: false,
  aceita_financiamento: false,
  aceita_permuta: false,
  imovel_na_planta: false,
  area_util: null,
  area_total: null,
  ano_construcao: null,
  quartos: 0,
  suites: 0,
  salas: 0,
  banheiros: 0,
  elevadores: 0,
  vagas: 0,
  vagas_tipo: "",
  vagas_cobertura: "",
  valor_venda: null,
  valor_locacao: null,
  valor_condominio: null,
  valor_iptu: null,
  comissao_percent: null,
  descricao: "",
  diferenciais: [],
  video_url: "",
  publicado_site: true,
  publicado_portais: false,
  exibir_endereco_site: "apenas_bairro",
  exibir_endereco_portais: "apenas_bairro",
  cliente_id: null,
  captador_id: "",
  proprietario_novo: null,
};
