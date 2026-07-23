import type { Imovel, ImovelCaptador } from "@/types";

export function getCaptadorNome(captador: ImovelCaptador): string {
  return captador.nome_externo ?? captador.perfil?.nome ?? "—";
}

export function getCaptadoresLista(imovel: Imovel): ImovelCaptador[] {
  const captadores = imovel.captadores ?? [];
  if (captadores.length > 0) {
    return captadores;
  }

  if (imovel.captador_id && imovel.captador) {
    return [
      {
        id: imovel.captador_id,
        imovel_id: imovel.id,
        perfil_id: imovel.captador_id,
        nome_externo: null,
        principal: true,
        criado_em: imovel.criado_em,
        perfil: imovel.captador,
      },
    ];
  }

  return [];
}

export function getCaptadorPrincipal(imovel: Imovel): ImovelCaptador | null {
  const captadores = getCaptadoresLista(imovel);
  if (captadores.length > 0) {
    return captadores.find((item) => item.principal) ?? captadores[0] ?? null;
  }
  return null;
}

export function getCaptadorPrincipalNome(imovel: Imovel): string | null {
  const principal = getCaptadorPrincipal(imovel);
  if (principal) {
    return getCaptadorNome(principal);
  }
  return imovel.captador?.nome ?? null;
}
