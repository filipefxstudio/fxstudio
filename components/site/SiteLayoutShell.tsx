import { notFound } from "next/navigation";

import { FooterSite } from "@/components/site/FooterSite";
import { NavbarSite } from "@/components/site/NavbarSite";
import { SiteProvider } from "@/components/site/SiteProvider";
import { WhatsAppWidget } from "@/components/site/WhatsAppWidget";
import type { Corretor } from "@/types";

interface SiteLayoutShellProps {
  corretor: Corretor | null;
  basePath: string;
  children: React.ReactNode;
}

export function SiteLayoutShell({ corretor, basePath, children }: SiteLayoutShellProps) {
  if (!corretor) {
    notFound();
  }

  return (
    <SiteProvider corretor={corretor} basePath={basePath}>
      <div className="flex min-h-full flex-col bg-white text-[#2D3748]">
        <NavbarSite />
        <main className="flex-1">{children}</main>
        <FooterSite corretor={corretor} basePath={basePath} />
        <WhatsAppWidget />
      </div>
    </SiteProvider>
  );
}
