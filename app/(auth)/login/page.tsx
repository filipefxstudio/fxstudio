import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | FX Studio",
  description: "Acesse seu painel FX Studio",
};

export default function LoginPage() {
  return <LoginForm />;
}
