export interface CaracteristicaCategoria {
  id: string;
  titulo: string;
  itens: readonly string[];
}

export const CARACTERISTICAS_CHECKLIST: CaracteristicaCategoria[] = [
  {
    id: "imovel",
    titulo: "Características do imóvel",
    itens: [
      "Aceita animais",
      "Aquecimento",
      "Ar-condicionado",
      "Área de serviço",
      "Armário embutido",
      "Armário embutido no quarto",
      "Armário na cozinha",
      "Armário no banheiro",
      "Box blindex",
      "Closet",
      "Conexão à internet",
      "Cozinha americana",
      "Cozinha grande",
      "Depósito",
      "Escritório",
      "Interfone",
      "Mobiliado",
      "Quintal",
      "TV a cabo",
      "Varanda",
      "Varanda gourmet",
    ],
  },
  {
    id: "lazer",
    titulo: "Lazer e esporte",
    itens: [
      "Academia",
      "Churrasqueira",
      "Cinema",
      "Espaço gourmet",
      "Jardim",
      "Piscina",
      "Playground",
      "Quadra de tênis",
      "Quadra poliesportiva",
      "Salão de festas",
      "Salão de jogos",
    ],
  },
  {
    id: "condominio",
    titulo: "Condomínio",
    itens: [
      "Acesso para deficientes",
      "Bicicletário",
      "Cozinha",
      "Elevador",
      "Garagem",
      "Gramado",
      "Lavanderia",
      "Recepção",
      "Sauna",
      "Spa",
    ],
  },
  {
    id: "seguranca",
    titulo: "Segurança",
    itens: [
      "Circuito de segurança",
      "Condomínio fechado",
      "Portão eletrônico",
      "Portaria 24h",
      "Sistema de alarme",
      "Vigia",
    ],
  },
] as const;

export const TODAS_CARACTERISTICAS = CARACTERISTICAS_CHECKLIST.flatMap(
  (categoria) => categoria.itens,
);
