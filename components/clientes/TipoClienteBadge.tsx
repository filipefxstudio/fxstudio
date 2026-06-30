import type { TipoCliente } from "@/types";
import { cn } from "@/lib/utils";

const tipoConfig: Record<
  TipoCliente,
  { label: string; className: string }
> = {
  lead: {
    label: "Lead",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
  proprietario: {
    label: "Proprietário",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  },
  ambos: {
    label: "Ambos",
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  },
};

interface TipoClienteBadgeProps {
  tipo: TipoCliente;
  className?: string;
}

export function TipoClienteBadge({ tipo, className }: TipoClienteBadgeProps) {
  const config = tipoConfig[tipo];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
