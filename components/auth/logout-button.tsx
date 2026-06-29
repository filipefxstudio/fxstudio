import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={cn("text-muted-foreground", className)}
      >
        Sair
      </Button>
    </form>
  );
}
