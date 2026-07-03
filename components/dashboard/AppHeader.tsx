"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, Menu, UserRound } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { useSidebarContext } from "@/components/dashboard/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  nome: string;
  slug: string;
  logoUrl?: string | null;
}

export function AppHeader({ nome, slug, logoUrl }: AppHeaderProps) {
  const { collapsed, toggleCollapsed, setOpen } = useSidebarContext();
  const primeiroNome = nome.split(" ")[0] ?? nome;
  const siteUrl = slug ? `/${slug}` : null;

  function handleMenuClick() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setOpen(true);
      return;
    }
    toggleCollapsed();
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-10 items-center justify-between border-b border-border bg-white px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={handleMenuClick}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-muted"
          aria-label={
            collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
          }
        >
          {collapsed ? (
            <Menu className="size-4" />
          ) : (
            <>
              <ArrowLeft className="hidden size-4 md:block" />
              <Menu className="size-4 md:hidden" />
            </>
          )}
        </button>

        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="max-h-7 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <span className="truncate text-sm font-semibold text-primary">FX Studio</span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-8 max-w-[180px] items-center gap-1.5 rounded-md px-2 text-sm text-primary transition-colors hover:bg-muted",
            )}
          >
            <UserRound className="size-4 shrink-0" />
            <span className="truncate">{primeiroNome}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracoes">Meu perfil</Link>
          </DropdownMenuItem>
          {siteUrl ? (
            <DropdownMenuItem asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                Ver meu site
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="p-0">
            <LogoutButton className="h-auto w-full justify-start rounded-none px-2 py-1.5 font-normal hover:bg-muted" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
