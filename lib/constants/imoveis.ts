import type { FinalidadeImovel, StatusImovel, TipoImovel } from "@/types";

export const TIPOS_IMOVEL: { value: TipoImovel; label: string }[] = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "cobertura", label: "Cobertura" },
  { value: "studio", label: "Studio" },
];

export const FINALIDADES_IMOVEL: { value: FinalidadeImovel; label: string }[] = [
  { value: "venda", label: "Venda" },
  { value: "locacao", label: "Locação" },
];

export const STATUS_IMOVEL: { value: StatusImovel; label: string }[] = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
  { value: "locado", label: "Locado" },
];

export const DIFERENCIAIS_OPCOES = [
  "Piscina",
  "Churrasqueira",
  "Portaria 24h",
  "Academia",
  "Elevador",
  "Varanda",
  "Sacada",
  "Área de lazer",
  "Playground",
  "Salão de festas",
  "Mobiliado",
  "Ar condicionado",
  "Vista para o mar",
  "Pet friendly",
  "Quintal",
  "Suíte master",
  "Closet",
  "Lavabo",
  "Depósito",
  "Vaga coberta",
] as const;

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const IMOVEL_LIMITS: Record<"basico" | "profissional" | "premium", number | null> = {
  basico: 30,
  profissional: null,
  premium: null,
};

export const STORAGE_BUCKET_IMOVEIS = "imoveis-fotos";
