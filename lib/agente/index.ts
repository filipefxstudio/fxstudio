import { montarContexto } from "@/lib/agente/contexto";
import { gerarSystemPrompt } from "@/lib/agente/prompt";
import { processarAnthropic } from "@/lib/agente/provedores/anthropic";
import { processarGemini } from "@/lib/agente/provedores/gemini";
import { processarOpenAI } from "@/lib/agente/provedores/openai";
import type {
  AgenteConfig,
  Corretor,
  Imovel,
  Lead,
  LeadInteracao,
  RespostaAgente,
} from "@/types";

function parseHorarioParaDecimal(horario: string): number {
  const [horaStr, minutoStr] = horario.split(":");
  const hora = Number.parseInt(horaStr ?? "0", 10);
  const minuto = Number.parseInt(minutoStr ?? "0", 10);
  return hora + minuto / 60;
}

function obterHoraAtualBrasil(): number {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const hora = Number.parseInt(
    parts.find((part) => part.type === "hour")?.value ?? "0",
    10,
  );
  const minuto = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value ?? "0",
    10,
  );

  return hora + minuto / 60;
}

function foraDoHorario(config: AgenteConfig): boolean {
  const agora = obterHoraAtualBrasil();
  const inicio = parseHorarioParaDecimal(config.horario_inicio);
  const fim = parseHorarioParaDecimal(config.horario_fim);
  return agora < inicio || agora > fim;
}

export async function processarAgenteIA(
  mensagemLead: string,
  lead: Lead,
  corretor: Corretor,
  config: AgenteConfig,
  imoveis: Imovel[],
  historico: LeadInteracao[],
): Promise<RespostaAgente> {
  if (foraDoHorario(config)) {
    return {
      texto: `Olá! Nosso atendimento funciona das ${config.horario_inicio} às ${config.horario_fim}. Responderei sua mensagem assim que possível! 😊`,
      tokens_usados: 0,
      provedor: config.provedor,
      modelo: config.modelo,
    };
  }

  const contexto = montarContexto(lead, imoveis, historico);
  const systemPrompt = gerarSystemPrompt(corretor, config, contexto);

  switch (config.provedor) {
    case "openai":
      return processarOpenAI(systemPrompt, mensagemLead, historico, config);
    case "anthropic":
      return processarAnthropic(systemPrompt, mensagemLead, historico, config);
    case "gemini":
      return processarGemini(systemPrompt, mensagemLead, historico, config);
    default:
      throw new Error(`Provedor de IA desconhecido: ${config.provedor}`);
  }
}
