export interface OnboardingItem {
  id: string;
  label: string;
  concluido: boolean;
  href?: string;
}

export function getOnboardingItems(options: {
  perfilCompleto: boolean;
}): OnboardingItem[] {
  return [
    { id: "conta", label: "Conta criada", concluido: true },
    {
      id: "perfil",
      label: "Complete perfil",
      concluido: options.perfilCompleto,
      href: "/dashboard/configuracoes",
    },
    {
      id: "whatsapp",
      label: "Configure WhatsApp",
      concluido: false,
      href: "/dashboard/configuracoes",
    },
    {
      id: "imovel",
      label: "Cadastre imóvel",
      concluido: false,
      href: "/dashboard/imoveis/novo",
    },
    {
      id: "site",
      label: "Veja site",
      concluido: false,
    },
  ];
}
