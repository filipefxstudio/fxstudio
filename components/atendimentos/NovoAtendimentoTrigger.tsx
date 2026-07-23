"use client";

import { useState, type ReactNode } from "react";
import { Plus, UserPlus } from "lucide-react";

import { NovoAtendimentoPreCheckModal } from "@/components/atendimentos/NovoAtendimentoPreCheckModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NovoAtendimentoTriggerProps {
  variant?: "button" | "icon";
  className?: string;
  children?: ReactNode;
}

export function NovoAtendimentoTrigger({
  variant = "button",
  className,
  children,
}: NovoAtendimentoTriggerProps) {
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={className}
              aria-label="Novo atendimento"
              onClick={() => setOpen(true)}
            >
              <UserPlus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Novo atendimento</TooltipContent>
        </Tooltip>
        <NovoAtendimentoPreCheckModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <Button type="button" className={cn(className)} onClick={() => setOpen(true)}>
        {children ?? (
          <>
            <Plus data-icon="inline-start" />
            Novo atendimento
          </>
        )}
      </Button>
      <NovoAtendimentoPreCheckModal open={open} onOpenChange={setOpen} />
    </>
  );
}
