import type { Imovel, ImovelFoto } from "@/types";
import type { ImovelFormValues } from "@/lib/validations/imovel";
import type { FotoItem } from "@/components/imoveis/FotoUpload";

function buildComplementoLegacy(imovel: Imovel): string {
  if (imovel.complemento) {
    return imovel.complemento;
  }

  const parts: string[] = [];
  if (imovel.complemento_tipo && imovel.complemento_numero) {
    parts.push(`${imovel.complemento_tipo} ${imovel.complemento_numero}`);
  }
  if (imovel.complemento_torre) {
    parts.push(imovel.complemento_torre);
  }
  return parts.join(", ");
}

export function imovelToFormValues(imovel: Imovel): ImovelFormValues {
  return {
    titulo: imovel.titulo ?? "",
    codigo_personalizado: imovel.codigo_personalizado ?? "",
    tipo: imovel.tipo,
    finalidade: imovel.finalidade,
    status: imovel.status,
    status_imovel_id: imovel.status_imovel_id ?? "",
    cep: imovel.cep ?? "",
    logradouro: imovel.logradouro ?? "",
    numero: imovel.numero ?? "",
    complemento: buildComplementoLegacy(imovel),
    complemento_tipo: imovel.complemento_tipo ?? "",
    complemento_numero: imovel.complemento_numero ?? "",
    complemento_torre: imovel.complemento_torre ?? "",
    condominio_nome: imovel.condominio_nome ?? "",
    bairro: imovel.bairro ?? "",
    cidade: imovel.cidade ?? "",
    estado: imovel.estado ?? "",
    latitude: imovel.latitude ?? null,
    longitude: imovel.longitude ?? null,
    portal_endereco_diferente: imovel.portal_endereco_diferente ?? false,
    portal_logradouro: imovel.portal_logradouro ?? "",
    portal_numero: imovel.portal_numero ?? "",
    portal_bairro: imovel.portal_bairro ?? "",
    portal_cep: imovel.portal_cep ?? "",
    portal_cidade: imovel.portal_cidade ?? "",
    portal_estado: imovel.portal_estado ?? "",
    local_chaves: imovel.local_chaves ?? "imobiliaria",
    chaves_codigo: imovel.chaves_codigo ?? "",
    chaves_descricao: imovel.chaves_descricao ?? "",
    exclusividade: imovel.exclusividade ?? false,
    imovel_ocupado: imovel.imovel_ocupado ?? false,
    contrato_aluguel_ativo: imovel.contrato_aluguel_ativo ?? false,
    aceita_financiamento: imovel.aceita_financiamento ?? false,
    aceita_permuta: imovel.aceita_permuta ?? false,
    imovel_na_planta: imovel.imovel_na_planta ?? false,
    area_util: imovel.area_util ?? null,
    area_total: imovel.area_total ?? null,
    ano_construcao: imovel.ano_construcao ?? null,
    quartos: imovel.quartos,
    suites: imovel.suites,
    salas: imovel.salas ?? 0,
    banheiros: imovel.banheiros,
    elevadores: imovel.elevadores ?? 0,
    vagas: imovel.vagas,
    vagas_tipo: imovel.vagas_tipo ?? "",
    vagas_cobertura: imovel.vagas_cobertura ?? "",
    valor_venda: imovel.valor_venda ?? null,
    valor_locacao: imovel.valor_locacao ?? null,
    valor_condominio: imovel.valor_condominio ?? null,
    valor_iptu: imovel.valor_iptu ?? null,
    descricao: imovel.descricao ?? "",
    diferenciais: imovel.diferenciais ?? [],
    video_url: imovel.video_url ?? "",
    publicado_site: imovel.publicado_site,
    publicado_portais: imovel.publicado_portais ?? false,
    cliente_id: imovel.cliente_id ?? null,
    proprietario_novo: null,
  };
}

export function fotosToFotoItems(fotos: ImovelFoto[]): FotoItem[] {
  return [...fotos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((foto, index) => ({
      id: foto.id,
      existingId: foto.id,
      previewUrl: foto.url,
      legenda: foto.legenda ?? "",
      ordem: index,
    }));
}

export function buildComplementoString(values: ImovelFormValues): string {
  const parts: string[] = [];
  if (values.complemento_tipo && values.complemento_numero) {
    parts.push(`${values.complemento_tipo} ${values.complemento_numero}`);
  }
  if (values.complemento_torre) {
    parts.push(values.complemento_torre);
  }
  if (values.condominio_nome) {
    parts.push(values.condominio_nome);
  }
  return parts.join(" — ") || values.complemento?.trim() || "";
}
