"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within DashboardShell");
  }
  return context;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
] as const;

interface DashboardShellProps {
  nome: string;
  slug: string;
  children: ReactNode;
}

export function DashboardShell({ nome, slug, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen bg-background">
        <SidebarPanel nome={nome} slug={slug} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger() {
  const { setOpen } = useSidebarContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-muted md:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="size-5" />
    </button>
  );
}

interface SidebarPanelProps {
  nome: string;
  slug: string;
}

function SidebarPanel({ nome, slug }: SidebarPanelProps) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebarContext();

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const content = (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">
          CRM Imobiliário
        </p>
        <p className="mt-1 text-lg font-bold">FX Studio</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4 text-sm">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
            <UserRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{nome}</p>
            <Link
              href={slug ? `/${slug}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-white/70 transition-colors hover:text-white"
            >
              Ver meu site
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
        <div className="mt-2 px-2">
          <LogoutButton className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-primary text-primary-foreground md:flex">
        {content}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={close}
          />
          <aside className="relative flex h-full w-60 max-w-[85vw] flex-col bg-primary text-primary-foreground shadow-xl">
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-5 inline-flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
