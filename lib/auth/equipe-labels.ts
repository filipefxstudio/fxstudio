import type { PapelUsuario } from "@/types";

export const PAPEL_DESCRICOES: Record<PapelUsuario, string> = {
  admin: "Controle total: gerencia equipe, configurações e todas as permissões.",
  gerente: "Visão ampla da operação, aprova imóveis e transfere atendimentos. Não gerencia equipe.",
  corretor: "Acesso aos próprios atendimentos e imóveis em cadastro.",
};

export const PAPEL_LABELS: Record<PapelUsuario, string> = {
  admin: "Administrador",
  gerente: "Gerente/Diretor",
  corretor: "Corretor",
};
