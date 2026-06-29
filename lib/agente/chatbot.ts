import { createServiceRoleClient } from "@/lib/supabase/admin";
import type {
  Corretor,
  EtapaChatbot,
  EtapaLead,
  Lead,
  TemperaturaLead,
} from "@/types";

const mensagensChatbot: Record<EtapaChatbot, string> = {
  inicio:
    "Olá! Sou o assistente de {nomeCorretor}. 😊\nVocê busca imóvel para *COMPRAR* ou *ALUGAR*?",
  finalidade: "Qual região ou bairro você prefere?",
  bairro: "Quantos quartos você precisa? (Ex: 2, 3, 4+)",
  quartos: "Qual sua faixa de valor? (Ex: até R$500mil ou R$2.000/mês)",
  valor:
    "E qual seu prazo para fechar negócio?\n1️⃣ Imediato\n2️⃣ 1 a 3 meses\n3️⃣ 3 a 6 meses\n4️⃣ Mais de 6 meses",
  prazo:
    "Perfeito! Registrei suas preferências. {nomeCorretor} vai entrar em contato em breve. 🏡",
  concluido: "",
};

const proximaEtapa: Record<EtapaChatbot, EtapaChatbot> = {
  inicio: "finalidade",
  finalidade: "bairro",
  bairro: "quartos",
  quartos: "valor",
  valor: "prazo",
  prazo: "concluido",
  concluido: "concluido",
};

function substituirNomeCorretor(mensagem: string, nomeCorretor: string): string {
  return mensagem.replaceAll("{nomeCorretor}", nomeCorretor);
}

function normalizarEtapa(etapa: Lead["etapa_chatbot"]): EtapaChatbot {
  if (etapa && etapa in mensagensChatbot) {
    return etapa;
  }
  return "inicio";
}

function detectarFinalidade(mensagem: string): "compra" | "locacao" | null {
  const texto = mensagem.toLowerCase();

  if (
    /\b(comprar|compra|adquirir|venda)\b/.test(texto) ||
    texto.includes("comprar")
  ) {
    return "compra";
  }

  if (
    /\b(alugar|aluguel|locacao|locação|arrendar)\b/.test(texto) ||
    texto.includes("alugar")
  ) {
    return "locacao";
  }

  return null;
}

function parseQuartos(mensagem: string): number | null {
  const match = mensagem.match(/(\d+)\s*\+?/);
  if (!match) {
    return null;
  }

  const quartos = Number.parseInt(match[1], 10);
  return Number.isNaN(quartos) ? null : quartos;
}

function parseFaixaValor(mensagem: string): {
  valor_minimo?: number;
  valor_maximo?: number;
} {
  const numeros = mensagem.match(/\d[\d.,]*/g);

  if (!numeros?.length) {
    return {};
  }

  const valores = numeros
    .map((item) => Number.parseFloat(item.replace(/\./g, "").replace(",", ".")))
    .filter((valor) => !Number.isNaN(valor));

  if (valores.length === 0) {
    return {};
  }

  if (valores.length === 1) {
    return { valor_maximo: valores[0] };
  }

  return {
    valor_minimo: Math.min(...valores),
    valor_maximo: Math.max(...valores),
  };
}

function parsePrazo(mensagem: string): string {
  const texto = mensagem.toLowerCase().trim();

  if (texto === "1" || texto.includes("imediato")) {
    return "imediato";
  }

  if (texto === "2" || /1\s*a\s*3/.test(texto)) {
    return "1-3 meses";
  }

  if (texto === "3" || /3\s*a\s*6/.test(texto)) {
    return "3-6 meses";
  }

  if (texto === "4" || texto.includes("6") || texto.includes("mais")) {
    return "6+ meses";
  }

  return mensagem.trim();
}

function calcularTemperatura(prazo: string | null | undefined): TemperaturaLead {
  if (!prazo) {
    return "morno";
  }

  const texto = prazo.toLowerCase();

  if (texto.includes("imediato") || texto.startsWith("1")) {
    return "quente";
  }

  if (texto.includes("6+") || texto.includes("mais de 6")) {
    return "frio";
  }

  return "morno";
}

interface LeadUpdatePayload {
  etapa_chatbot: EtapaChatbot;
  finalidade_busca?: string;
  bairros_interesse?: string[];
  quartos_minimo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  prazo_decisao?: string;
  etapa?: EtapaLead;
  temperatura?: TemperaturaLead;
}

function processarRespostaEtapa(
  etapaAtual: EtapaChatbot,
  mensagemLead: string,
): LeadUpdatePayload | null {
  switch (etapaAtual) {
    case "inicio": {
      const finalidade = detectarFinalidade(mensagemLead);
      if (!finalidade) {
        return null;
      }

      return {
        etapa_chatbot: proximaEtapa.inicio,
        finalidade_busca: finalidade,
      };
    }
    case "finalidade":
      return {
        etapa_chatbot: proximaEtapa.finalidade,
        bairros_interesse: [mensagemLead.trim()],
      };
    case "bairro": {
      const quartos = parseQuartos(mensagemLead);
      return {
        etapa_chatbot: proximaEtapa.bairro,
        quartos_minimo: quartos ?? undefined,
      };
    }
    case "quartos": {
      const faixa = parseFaixaValor(mensagemLead);
      return {
        etapa_chatbot: proximaEtapa.quartos,
        ...faixa,
      };
    }
    case "valor": {
      const prazo = parsePrazo(mensagemLead);
      return {
        etapa_chatbot: proximaEtapa.valor,
        prazo_decisao: prazo,
        temperatura: calcularTemperatura(prazo),
      };
    }
    case "prazo":
      return {
        etapa_chatbot: proximaEtapa.prazo,
        etapa: "qualificado",
        temperatura: calcularTemperatura(parsePrazo(mensagemLead)),
      };
    case "concluido":
      return {
        etapa_chatbot: "concluido",
      };
    default:
      return null;
  }
}

export async function processarChatbot(
  lead: Lead,
  mensagemLead: string,
  corretor: Corretor,
): Promise<string> {
  const supabase = createServiceRoleClient();
  const etapaAtual = normalizarEtapa(lead.etapa_chatbot);
  const nomeCorretor = corretor.nome;

  if (etapaAtual === "concluido") {
    return substituirNomeCorretor(
      "Suas preferências já foram registradas. Em breve entraremos em contato!",
      nomeCorretor,
    );
  }

  const atualizacao = processarRespostaEtapa(etapaAtual, mensagemLead);

  if (!atualizacao) {
    return substituirNomeCorretor(mensagensChatbot.inicio, nomeCorretor);
  }

  const proxima = atualizacao.etapa_chatbot;
  const mensagemResposta =
    proxima === "concluido"
      ? mensagensChatbot.prazo
      : mensagensChatbot[proxima];

  const { error } = await supabase
    .from("leads")
    .update({
      etapa_chatbot: proxima,
      finalidade_busca: atualizacao.finalidade_busca ?? lead.finalidade_busca,
      bairros_interesse:
        atualizacao.bairros_interesse ?? lead.bairros_interesse,
      quartos_minimo: atualizacao.quartos_minimo ?? lead.quartos_minimo,
      valor_minimo: atualizacao.valor_minimo ?? lead.valor_minimo,
      valor_maximo: atualizacao.valor_maximo ?? lead.valor_maximo,
      prazo_decisao: atualizacao.prazo_decisao ?? lead.prazo_decisao,
      etapa: atualizacao.etapa ?? lead.etapa,
      temperatura: atualizacao.temperatura ?? lead.temperatura,
    })
    .eq("id", lead.id);

  if (error) {
    console.error("[processarChatbot] Falha ao atualizar lead", {
      leadId: lead.id,
      message: error.message,
    });
    throw new Error("Não foi possível atualizar o lead no chatbot.");
  }

  return substituirNomeCorretor(mensagemResposta, nomeCorretor);
}
