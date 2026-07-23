import { cn } from "@/lib/utils";
import type { ImovelWorkflowBadgeVariant } from "@/lib/atendimentos/badges";

const BADGE_CONFIG: Record<
  ImovelWorkflowBadgeVariant,
  { label: string; className: string }
> = {
  visita: {
    label: "Visita",
    className: "bg-sky-600 text-white",
  },
  proposta: {
    label: "Proposta",
    className: "bg-amber-600 text-white",
  },
  negocio_fechado: {
    label: "Neg. Fechado",
    className: "bg-emerald-700 text-white",
  },
};

interface ImovelPhotoBadgeProps {
  variant: ImovelWorkflowBadgeVariant;
  className?: string;
}

export function ImovelPhotoBadge({ variant, className }: ImovelPhotoBadgeProps) {
  const config = BADGE_CONFIG[variant];

  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
