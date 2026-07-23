"use client";

import { AbaFichaVisita } from "@/components/configuracoes/AbaFichaVisita";
import { AbaMarcaDagua } from "@/components/configuracoes/AbaMarcaDagua";
import { AbaMotivosDesativacao } from "@/components/configuracoes/AbaMotivosDesativacao";
import { AbaStatusImovel } from "@/components/configuracoes/AbaStatusImovel";
import { AbaTiposImovel } from "@/components/configuracoes/AbaTiposImovel";
import type {
  ConfigFichaVisita,
  MarcaDaguaConfig,
  MotivoDesativacao,
  StatusImovel,
  TipoImovelCustom,
} from "@/types";

interface AbaImoveisConfigProps {
  tiposImovel: TipoImovelCustom[];
  statusImovel: StatusImovel[];
  marcaDaguaConfig: MarcaDaguaConfig | null;
  fichaVisitaConfig: ConfigFichaVisita | null;
  motivosDesativacao: MotivoDesativacao[];
}

export function AbaImoveisConfig({
  tiposImovel,
  statusImovel,
  marcaDaguaConfig,
  fichaVisitaConfig,
  motivosDesativacao,
}: AbaImoveisConfigProps) {
  return (
    <div className="space-y-6">
      <AbaTiposImovel tipos={tiposImovel} />
      <AbaStatusImovel statusList={statusImovel} />
      <AbaMotivosDesativacao initialMotivos={motivosDesativacao} />
      <AbaMarcaDagua initialConfig={marcaDaguaConfig} />
      <AbaFichaVisita initialConfig={fichaVisitaConfig} />
    </div>
  );
}
