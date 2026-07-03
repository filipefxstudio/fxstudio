import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { FormularioLeadSite } from "@/components/site/FormularioLeadSite";
import type { Corretor } from "@/types";

interface SiteContatoContentProps {
  corretor: Corretor;
}

export function SiteContatoContent({ corretor }: SiteContatoContentProps) {
  const telefone = corretor.contato_telefone ?? corretor.telefone;
  const email = corretor.contato_email ?? corretor.email;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Entre em contato com {corretor.nome} para tirar dúvidas ou agendar visitas.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">Informações</h2>
          <ul className="space-y-4 text-sm text-[#2D3748]">
            {telefone ? (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                {telefone}
              </li>
            ) : null}
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              {email}
            </li>
            {corretor.contato_endereco ? (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {corretor.contato_endereco}
              </li>
            ) : null}
            {corretor.contato_horario ? (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                {corretor.contato_horario}
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">Envie uma mensagem</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha o formulário e retornaremos o contato o mais breve possível.
          </p>
          <div className="mt-6">
            <FormularioLeadSite />
          </div>
        </div>
      </div>
    </div>
  );
}
