import { z } from "zod";

export const clienteFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente."),
  telefone: z.string().trim().min(8, "Informe um telefone válido."),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Informe um e-mail válido.",
    ),
  cpf: z.string().trim().optional(),
  data_nascimento: z.string().trim().optional(),
  profissao: z.string().trim().optional(),
  estado_civil: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
  tipo: z.enum(["lead", "proprietario", "ambos"], {
    error: "Selecione o tipo de relacionamento.",
  }),
  eh_construtor_investidor: z.boolean(),
  perfil_id: z.string().uuid().optional().nullable(),
});

export type ClienteFormValues = z.infer<typeof clienteFormSchema>;

export const clienteFormDefaultValues: ClienteFormValues = {
  nome: "",
  telefone: "",
  email: "",
  cpf: "",
  data_nascimento: "",
  profissao: "",
  estado_civil: "",
  observacoes: "",
  tipo: "lead",
  eh_construtor_investidor: false,
  perfil_id: null,
};
