"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import { DeleteImovelDialog } from "@/components/imoveis/DeleteImovelDialog";
import { toast } from "@/hooks/use-toast";
import { updateImovelStatus, validarAtualizacao } from "@/lib/actions/imoveis";
import { getPublicImovelUrl } from "@/lib/imoveis/format";
import { cn } from "@/lib/utils";
import type { Imovel, StatusImovel } from "@/types";

interface ImovelAcoesDropdownProps {
  imovel: Imovel;
  corretorSlug: string;
  statusList: StatusImovel[];
  variant?: "card" | "header";
  className?: string;
  onStatusChange?: (statusId: string) => void;
  onValidarAtualizacao?: (data: string) => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

function formatValidacaoDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ImovelAcoesDropdown({
  imovel,
  corretorSlug,
  statusList,
  variant = "card",
  className,
  onStatusChange,
  onValidarAtualizacao,
}: ImovelAcoesDropdownProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusSubmenuOpen, setStatusSubmenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? 280;
    const menuWidth = menu?.offsetWidth ?? 192;
    const gap = 4;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow;

    const top = openUpward ? rect.top - menuHeight - gap : rect.bottom + gap;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));

    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [menuOpen, statusSubmenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
      setStatusSubmenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function stopCardNav(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function closeMenu() {
    setMenuOpen(false);
    setStatusSubmenuOpen(false);
  }

  function handleShare(event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();

    if (!imovel.slug) {
      toast({
        variant: "destructive",
        title: "Link indisponível",
        description: "Este imóvel ainda não possui slug para compartilhamento.",
      });
      return;
    }

    const url = getPublicImovelUrl(corretorSlug, imovel.slug);

    void navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado",
        description: "O link público do imóvel foi copiado para a área de transferência.",
      });
    });
  }

  function handleStatusChange(statusId: string, event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();

    startTransition(async () => {
      const result = await updateImovelStatus(imovel.id, statusId);

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }

      toast({ title: "Status atualizado." });
      onStatusChange?.(statusId);
      router.refresh();
    });
  }

  function handleValidar(event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();

    startTransition(async () => {
      const result = await validarAtualizacao(imovel.id);

      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error });
        return;
      }

      const data = result.data ?? new Date().toISOString();
      toast({
        title: `Atualização registrada em ${formatValidacaoDate(data)}`,
      });
      onValidarAtualizacao?.(data);
      router.refresh();
    });
  }

  function handleEdit(event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();
    router.push(`/dashboard/imoveis/${imovel.id}/editar`);
  }

  function handleVerDetalhes(event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();
    router.push(`/dashboard/imoveis/${imovel.id}`);
  }

  function handleDelete(event: React.MouseEvent) {
    stopCardNav(event);
    closeMenu();
    setDeleteOpen(true);
  }

  const triggerClass =
    variant === "header"
      ? "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
      : "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted";

  const menuContent = menuOpen ? (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
      style={
        menuPosition
          ? { top: menuPosition.top, left: menuPosition.left }
          : { top: -9999, left: -9999, visibility: "hidden" as const }
      }
    >
      {variant === "card" ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          onClick={handleVerDetalhes}
        >
          <Eye className="size-4" />
          Ver detalhes
        </button>
      ) : null}

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
        onClick={handleEdit}
      >
        <Pencil className="size-4" />
        {variant === "header" ? "Editar imóvel" : "Editar"}
      </button>

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
        onClick={handleShare}
      >
        <Share2 className="size-4" />
        Compartilhar
      </button>

      <div className="relative">
        <button
          type="button"
          disabled={isPending}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          onClick={(event) => {
            stopCardNav(event);
            setStatusSubmenuOpen((open) => !open);
          }}
        >
          <span className="flex items-center gap-2">
            <ChevronRight className="size-4" />
            Alterar status
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </button>

        {statusSubmenuOpen ? (
          <div className="border-t border-border py-1">
            {statusList.map((status) => (
              <button
                key={status.id}
                type="button"
                disabled={isPending || imovel.status_imovel_id === status.id}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                onClick={(event) => handleStatusChange(status.id, event)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: status.cor }}
                />
                {status.nome}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {variant === "header" ? (
        <button
          type="button"
          disabled={isPending}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          onClick={handleValidar}
        >
          <Check className="size-4" />
          Validar atualização
        </button>
      ) : null}

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
        onClick={handleDelete}
      >
        <Trash2 className="size-4" />
        Excluir
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className={cn("relative", className)}>
        <button
          ref={triggerRef}
          type="button"
          className={triggerClass}
          onClick={(event) => {
            stopCardNav(event);
            setMenuOpen((open) => !open);
          }}
        >
          <MoreVertical className="size-4" />
          Ações
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </div>

      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}

      <DeleteImovelDialog
        imovelId={imovel.id}
        imovelTitulo={imovel.titulo ?? imovel.codigo ?? "Imóvel"}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
