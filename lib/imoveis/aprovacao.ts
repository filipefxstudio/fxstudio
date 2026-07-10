import type { Imovel, PapelUsuario, Perfil, StatusAprovacaoImovel } from "@/types";

/** admin equivale a diretor no fluxo de aprovação */
export function isGestorImovel(papel: PapelUsuario | undefined): boolean {
  return papel === "gerente" || papel === "admin";
}

export function podeAprovarImovel(perfil: Perfil | null | undefined): boolean {
  return Boolean(perfil?.ativo && isGestorImovel(perfil.papel));
}

export function podeEnviarParaAprovacao(imovel: Pick<Imovel, "status_aprovacao">): boolean {
  return imovel.status_aprovacao === "em_cadastro";
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
