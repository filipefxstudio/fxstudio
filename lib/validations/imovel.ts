import { z } from "zod";

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

const baseImovelSchema = z.object({
  titulo: z.string().trim().min(3, "O título deve ter pelo menos 3 caracteres."),
  tipo: z.enum(
    ["apartamento", "casa", "terreno", "comercial", "cobertura", "studio"],
    { error: "Selecione o tipo do imóvel." },
  ),
  finalidade: z.enum(["venda", "locacao"], {
    error: "Selecione a finalidade.",
  }),
  status: z.enum(["disponivel", "reservado", "vendido", "locado"], {
    error: "Selecione o status.",
  }),
  cep: z
    .string()
    .trim()
    .min(8, "Informe um CEP válido.")
    .max(9, "CEP inválido."),
  logradouro: z.string().trim().min(1, "Informe o logradouro."),
  numero: z.string().trim().min(1, "Informe o número."),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().min(1, "Informe o bairro."),
  cidade: z.string().trim().min(1, "Informe a cidade."),
  estado: z
    .string()
    .trim()
    .length(2, "Informe a UF com 2 letras.")
    .transform((value) => value.toUpperCase()),
  latitude: optionalNumber("Latitude inválida."),
  longitude: optionalNumber("Longitude inválida."),
  area_util: optionalNumber("Área útil inválida."),
  area_total: optionalNumber("Área total inválida."),
  quartos: requiredInteger(),
  suites: requiredInteger(),
  banheiros: requiredInteger(),
  vagas: requiredInteger(),
  valor_venda: optionalNumber("Valor de venda inválido."),
  valor_locacao: optionalNumber("Valor de locação inválido."),
  valor_condominio: optionalNumber("Valor do condomínio inválido."),
  valor_iptu: optionalNumber("Valor do IPTU inválido."),
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
});

export type ImovelFormValues = z.infer<typeof imovelFormSchema>;

export const imovelFormDefaultValues: ImovelFormValues = {
  titulo: "",
  tipo: "apartamento",
  finalidade: "venda",
  status: "disponivel",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  latitude: null,
  longitude: null,
  area_util: null,
  area_total: null,
  quartos: 0,
  suites: 0,
  banheiros: 0,
  vagas: 0,
  valor_venda: null,
  valor_locacao: null,
  valor_condominio: null,
  valor_iptu: null,
  descricao: "",
  diferenciais: [],
  video_url: "",
  publicado_site: true,
};
