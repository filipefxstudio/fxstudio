import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  iconOnly?: boolean;
}

export function LogoutButton({ className, iconOnly }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size={iconOnly ? "icon-sm" : "sm"}
        className={cn("text-muted-foreground", className)}
        aria-label={iconOnly ? "Sair" : undefined}
      >
        {iconOnly ? <LogOut className="size-4" /> : "Sair"}
      </Button>
    </form>
  );
}
