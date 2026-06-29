import { Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, buildContatoWhatsAppMessage } from "@/lib/site/whatsapp";
import { getCorretorByDominio } from "@/lib/site/queries";

interface CustomContatoPageProps {
  params: Promise<{ hostname: string }>;
}

export default async function CustomContatoPage({ params }: CustomContatoPageProps) {
  const { hostname } = await params;
  const decodedHostname = decodeURIComponent(hostname);
  const corretor = await getCorretorByDominio(decodedHostname);

  if (!corretor) {
    return null;
  }

  const whatsappUrl = buildWhatsAppUrl(corretor, buildContatoWhatsAppMessage());

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Entre em contato com {corretor.nome} para tirar dúvidas ou agendar visitas.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        {corretor.telefone ? (
          <p className="inline-flex items-center gap-3 text-[#2D3748]">
            <Phone className="size-5 text-primary" />
            {corretor.telefone}
          </p>
        ) : null}
        <p className="inline-flex items-center gap-3 text-[#2D3748]">
          <Mail className="size-5 text-primary" />
          {corretor.email}
        </p>
      </div>

      {whatsappUrl ? (
        <Button asChild className="mt-6 bg-[#25D366] hover:bg-[#1da851]">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Conversar no WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}
