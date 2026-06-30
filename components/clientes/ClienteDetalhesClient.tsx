"use client";

import { useRouter } from "next/navigation";

import { ClienteForm } from "@/components/clientes/ClienteForm";
import type { Cliente } from "@/types";

interface ClienteDetalhesClientProps {
  mode: "edit";
  cliente: Cliente;
}

export function ClienteDetalhesClient({ mode, cliente }: ClienteDetalhesClientProps) {
  const router = useRouter();

  return (
    <ClienteForm
      mode={mode}
      cliente={cliente}
      onSuccess={() => router.push(`/dashboard/clientes/${cliente.id}`)}
    />
  );
}
