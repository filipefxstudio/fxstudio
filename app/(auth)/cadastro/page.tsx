import type { Metadata } from "next";

import { CadastroForm } from "@/components/auth/cadastro-form";

export const metadata: Metadata = {
  title: "Cadastro | FX Studio",
  description: "Crie sua conta no FX Studio",
};

export default function CadastroPage() {
  return <CadastroForm />;
}
