import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { SidebarTrigger } from "@/components/dashboard/Sidebar";
import { getSaudacao } from "@/lib/supabase/get-corretor";

interface HeaderProps {
  nome: string;
}

export function Header({ nome }: HeaderProps) {
  const saudacao = getSaudacao();
  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <header className="border-b border-border bg-card px-4 py-4 md:px-6">
      <div className="flex items-start gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold text-primary md:text-2xl">
            {saudacao}, {nome.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dataFormatada}</p>
        </div>
      </div>
    </header>
  );
}
