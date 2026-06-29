import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { buildWhatsAppUrl, buildContatoWhatsAppMessage } from "@/lib/site/whatsapp";
import type { Corretor } from "@/types";

import { sitePath } from "@/lib/site/paths";

interface FooterSiteProps {
  corretor: Corretor;
  basePath: string;
}

export function FooterSite({ corretor, basePath }: FooterSiteProps) {
  const whatsappUrl = buildWhatsAppUrl(corretor, buildContatoWhatsAppMessage());
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-lg font-semibold">{corretor.nome}</h3>
          {corretor.creci ? (
            <p className="mt-2 text-sm text-white/80">CRECI {corretor.creci}</p>
          ) : null}
          {corretor.sobre ? (
            <p className="mt-3 text-sm leading-relaxed text-white/80 line-clamp-4">
              {corretor.sobre}
            </p>
          ) : null}
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/90">Contato</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {corretor.telefone ? (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                {corretor.telefone}
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              {corretor.email}
            </li>
            {whatsappUrl ? (
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/90">Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link href={sitePath(basePath, "/imoveis")} className="hover:text-accent">
                Ver imóveis
              </Link>
            </li>
            <li>
              <Link href={sitePath(basePath, "/sobre")} className="hover:text-accent">
                Sobre
              </Link>
            </li>
            <li>
              <Link href={sitePath(basePath, "/contato")} className="hover:text-accent">
                Contato
              </Link>
            </li>
          </ul>
          <p className="mt-6 flex items-start gap-2 text-xs text-white/60">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            Atendimento imobiliário em todo o Brasil
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-white/60 sm:px-6 lg:px-8">
          © {currentYear} {corretor.nome}. Powered by FX Studio.
        </p>
      </div>
    </footer>
  );
}
