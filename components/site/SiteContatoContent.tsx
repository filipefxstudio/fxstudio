import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { FormularioLeadSite } from "@/components/site/FormularioLeadSite";
import { SocialIcons } from "@/components/site/SocialIcons";
import {
  getSiteCreci,
  getSiteEmail,
  getSiteNomeExibicao,
  getSocialLinks,
} from "@/lib/site/social";
import type { Corretor } from "@/types";

interface SiteContatoContentProps {
  corretor: Corretor;
}

export function SiteContatoContent({ corretor }: SiteContatoContentProps) {
  const nomeExibicao = getSiteNomeExibicao(corretor);
  const creci = getSiteCreci(corretor);
  const email = getSiteEmail(corretor);
  const telVendas = corretor.site_telefone_vendas ?? corretor.contato_telefone ?? corretor.telefone;
  const telLocacao = corretor.site_telefone_locacao;
  const endereco = corretor.site_endereco ?? corretor.contato_endereco;
  const horario = corretor.site_horario ?? corretor.contato_horario;
  const socialLinks = getSocialLinks(corretor);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Entre em contato com {nomeExibicao} para tirar dúvidas ou agendar visitas.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">Informações</h2>
          <ul className="space-y-4 text-sm text-[#2D3748]">
            {creci ? (
              <li>
                <span className="font-medium text-primary">CRECI:</span> {creci}
              </li>
            ) : null}
            {telVendas ? (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Vendas:</span> {telVendas}
                </span>
              </li>
            ) : null}
            {telLocacao ? (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Locação:</span> {telLocacao}
                </span>
              </li>
            ) : null}
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              {email}
            </li>
            {endereco ? (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {endereco}
              </li>
            ) : null}
            {horario ? (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                {horario}
              </li>
            ) : null}
          </ul>
          <SocialIcons links={socialLinks} />
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
