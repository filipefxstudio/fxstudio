"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteImovel } from "@/lib/actions/imoveis";
import { toast } from "@/hooks/use-toast";

interface DeleteImovelDialogProps {
  imovelId: string;
  imovelTitulo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function DeleteImovelDialog({
  imovelId,
  imovelTitulo,
  open,
  onOpenChange,
  redirectTo = "/dashboard/imoveis",
}: DeleteImovelDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteImovel(imovelId);

      if (result.error) {
        setError(result.error);
        return;
      }

      toast({
        title: "Imóvel excluído",
        description: "O imóvel foi removido do portfólio.",
      });

      onOpenChange(false);
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir imóvel</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">
              {imovelTitulo || "este imóvel"}
            </span>
            ? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" data-icon="inline-start" />
                Excluindo...
              </>
            ) : (
              "Excluir imóvel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
