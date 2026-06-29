"use client";

import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, buildContatoWhatsAppMessage } from "@/lib/site/whatsapp";
import { cn } from "@/lib/utils";

import { useSite } from "./SiteProvider";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function NavbarSite() {
  const { corretor, link } = useSite();
  const [open, setOpen] = useState(false);
  const whatsappUrl = buildWhatsAppUrl(corretor, buildContatoWhatsAppMessage());

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={link("/")} className="flex min-w-0 items-center gap-3">
          {corretor.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={corretor.foto_url}
              alt={corretor.nome}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {corretor.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{corretor.nome}</p>
            {corretor.creci ? (
              <p className="truncate text-xs text-muted-foreground">CRECI {corretor.creci}</p>
            ) : null}
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={link(item.href)}
              className="text-sm font-medium text-[#2D3748] transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          {whatsappUrl ? (
            <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#1da851]">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </Button>
          ) : null}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-primary md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border bg-white md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={link(item.href)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#2D3748] hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
