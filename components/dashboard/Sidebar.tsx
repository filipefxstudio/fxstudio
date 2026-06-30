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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Settings,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "fx-sidebar-collapsed";

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
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
  { href: "/dashboard/clientes", label: "Clientes", icon: User },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
] as const;

interface DashboardShellProps {
  nome: string;
  slug: string;
  children: ReactNode;
}

export function DashboardShell({ nome, slug, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsed, toggleCollapsed }}>
      <TooltipProvider delayDuration={0}>
        <div className="min-h-screen bg-background">
          <SidebarPanel nome={nome} slug={slug} />
          <div
            className={cn(
              "flex min-h-screen flex-col transition-[margin] duration-300",
              collapsed ? "md:ml-16" : "md:ml-60",
            )}
          >
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </TooltipProvider>
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

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-lg font-medium transition-colors",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

interface SidebarContentProps {
  nome: string;
  slug: string;
  collapsed: boolean;
  showToggle: boolean;
  onNavigate?: () => void;
  onToggleCollapsed: () => void;
}

function SidebarContent({
  nome,
  slug,
  collapsed,
  showToggle,
  onNavigate,
  onToggleCollapsed,
}: SidebarContentProps) {
  const pathname = usePathname();

  const toggleButton = showToggle ? (
    <button
      type="button"
      onClick={onToggleCollapsed}
      className={cn(
        "inline-flex w-full items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white",
        collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2 text-sm",
      )}
      aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
    >
      {collapsed ? (
        <ChevronRight className="size-4 shrink-0" />
      ) : (
        <>
          <ChevronLeft className="size-4 shrink-0" />
          <span>Recolher menu</span>
        </>
      )}
    </button>
  ) : null;

  return (
    <>
      <div
        className={cn(
          "shrink-0 border-b border-white/10 py-6",
          collapsed ? "px-2 text-center" : "px-5",
        )}
      >
        {collapsed ? (
          <p className="text-lg font-bold">FX</p>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              CRM Imobiliário
            </p>
            <p className="mt-1 text-lg font-bold">FX Studio</p>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4 text-sm">
        {navItems.map(({ href, label, icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <SidebarNavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={isActive}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        {toggleButton}

        <div
          className={cn(
            "mt-2 flex items-center rounded-lg py-2",
            collapsed ? "justify-center px-0" : "gap-3 px-2",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  <UserRound className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{nome}</TooltipContent>
            </Tooltip>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className={cn("mt-2", collapsed ? "flex justify-center px-0" : "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <LogoutButton
                    iconOnly
                    className="text-white/70 hover:bg-white/10 hover:text-white"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <LogoutButton className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white" />
          )}
        </div>
      </div>
    </>
  );
}

function SidebarPanel({ nome, slug }: SidebarPanelProps) {
  const pathname = usePathname();
  const { open, setOpen, collapsed, toggleCollapsed } = useSidebarContext();

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

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-primary text-primary-foreground transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarContent
          nome={nome}
          slug={slug}
          collapsed={collapsed}
          showToggle
          onToggleCollapsed={toggleCollapsed}
        />
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
            <SidebarContent
              nome={nome}
              slug={slug}
              collapsed={false}
              showToggle={false}
              onNavigate={close}
              onToggleCollapsed={toggleCollapsed}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
