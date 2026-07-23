import type { Visita } from "@/types";

export const MSG_PROPOSTA_SEM_PARECER =
  "Registre o parecer da visita antes de cadastrar uma proposta.";

export const MSG_NEGOCIO_PROPOSTA_NAO_ACEITA =
  "Altere o status da proposta para Aceita antes de fechar o negócio.";

export function visitaTemParecerRegistrado(
  visita: Pick<Visita, "parecer"> | null | undefined,
): boolean {
  return Boolean(visita?.parecer);
}
