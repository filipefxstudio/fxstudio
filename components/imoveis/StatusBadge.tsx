import { STATUS_IMOVEL } from "@/lib/constants/imoveis";
import { cn } from "@/lib/utils";
import type { StatusImovel } from "@/types";

const STATUS_COLORS: Record<StatusImovel, string> = {
  disponivel: "#2DC653",
  reservado: "#F18F01",
  vendido: "#1E3A5F",
  locado: "#7C3AED",
};

interface StatusBadgeProps {
  status: StatusImovel;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_IMOVEL.find((item) => item.value === status)?.label ?? status;
  const color = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
