"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { AuditoriaImovel } from "@/types";

const ACAO_LABELS: Record<string, string> = {
  imovel_cadastrado: "Imóvel cadastrado",
  imovel_editado: "Imóvel editado",
  imovel_desativado: "Imóvel desativado",
  status_alterado: "Status alterado",
  status_automatico: "Status automático",
  atualizacao_validada: "Atualização validada",
  enviado_aprovacao: "Enviado para aprovação",
  imovel_aprovado: "Imóvel aprovado",
};

interface ImovelAuditoriaTabProps {
  registros: AuditoriaImovel[];
}

export function ImovelAuditoriaTab({ registros }: ImovelAuditoriaTabProps) {
  if (registros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum registro de auditoria ainda.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-border bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Ação</th>
            <th className="px-4 py-3 font-medium">Usuário</th>
            <th className="px-4 py-3 font-medium">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {format(new Date(item.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </td>
              <td className="px-4 py-3 font-medium">
                {ACAO_LABELS[item.acao] ?? item.acao}
              </td>
              <td className="px-4 py-3">{item.perfil?.nome ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.motivo ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
