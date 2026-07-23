import type { Imovel, PapelUsuario, Perfil, StatusAprovacaoImovel } from "@/types";

/** admin equivale a diretor no fluxo de aprovação */
export function isGestorImovel(papel: PapelUsuario | undefined): boolean {
  return papel === "gerente" || papel === "admin";
}

export function podeAprovarImovel(perfil: Perfil | null | undefined): boolean {
  return Boolean(perfil?.ativo && isGestorImovel(perfil.papel));
}

export function podeEnviarParaAprovacao(
  imovel: Pick<Imovel, "status_aprovacao" | "status">,
): boolean {
  if (imovel.status_aprovacao === "em_cadastro") {
    return true;
  }

  if (
    !imovel.status_aprovacao &&
    (imovel.status === "em_cadastro" || !imovel.status)
  ) {
    return true;
  }

  return false;
}

/** Exibe o botão "Enviar para aprovação" no formulário (novo ou edição). */
export function podeMostrarEnviarAprovacaoNoFormulario(
  imovel: Pick<Imovel, "status_aprovacao" | "status"> | null | undefined,
): boolean {
  if (!imovel) {
    return true;
  }

  return podeEnviarParaAprovacao(imovel);
}

export function podeEditarImovelCompleto(
  imovel: Pick<Imovel, "status_aprovacao">,
  perfil: Perfil | null | undefined,
): boolean {
  if (podeAprovarImovel(perfil)) {
    return true;
  }

  return (
    imovel.status_aprovacao === "em_cadastro" ||
    imovel.status_aprovacao === "aguardando_aprovacao"
  );
}

export function podePublicarImovel(
  imovel: Pick<Imovel, "status_aprovacao">,
  perfil: Perfil | null | undefined,
): boolean {
  if (podeAprovarImovel(perfil)) {
    return true;
  }

  return imovel.status_aprovacao === "aprovado";
}

export function podeAlterarStatusImovel(
  imovel: Pick<Imovel, "status_aprovacao">,
  perfil: Perfil | null | undefined,
): boolean {
  if (podeAprovarImovel(perfil)) {
    return true;
  }

  return (
    imovel.status_aprovacao !== "em_cadastro" &&
    imovel.status_aprovacao !== "aguardando_aprovacao"
  );
}

export function labelStatusAprovacao(status: StatusAprovacaoImovel): string {
  switch (status) {
    case "em_cadastro":
      return "Em cadastro";
    case "aguardando_aprovacao":
      return "Aguardando aprovação";
    case "aprovado":
      return "Aprovado";
    default:
      return status;
  }
}
