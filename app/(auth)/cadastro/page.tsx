import type { Metadata } from "next";

import { CadastroForm } from "@/components/auth/cadastro-form";

export const metadata: Metadata = {
  title: "Cadastro | Deskimob",
  description: "Crie sua conta no Deskimob",
};

export default function CadastroPage() {
  return <CadastroForm />;
}
