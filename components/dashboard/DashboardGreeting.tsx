import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getSaudacao } from "@/lib/supabase/get-corretor";

interface DashboardGreetingProps {
  nome: string;
}

export function DashboardGreeting({ nome }: DashboardGreetingProps) {
  const saudacao = getSaudacao();
  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const primeiroNome = nome.split(" ")[0] ?? nome;

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary md:text-2xl">
        {saudacao}, {primeiroNome}!
      </h1>
      <p className="mt-1 text-sm capitalize text-muted-foreground">{dataFormatada}</p>
    </div>
  );
}
