import type { SocialLink } from "@/lib/site/social";
import { cn } from "@/lib/utils";

function SocialIcon({ rede, className }: { rede: SocialLink["rede"]; className?: string }) {
  const props = { viewBox: "0 0 24 24", fill: "currentColor", className, "aria-hidden": true as const };

  switch (rede) {
    case "instagram":
      return (
        <svg {...props}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 9.1A2.9 2.9 0 1 1 9.1 12 2.9 2.9 0 0 1 12 9.1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 9 2 12 2 12s0 3 .4 4.8a2.5 2.5 0 0 0 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...props}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props}>
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.1c.5-1 1.8-2.1 3.7-2.1 4 0 4.7 2.6 4.7 6V24h-4v-7.1c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8V24h-4V8.5z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...props}>
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.91v-8.41H7.08v-3.5h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.5h-2.79v8.41C19.61 23.09 24 18.09 24 12.07z" />
        </svg>
      );
  }
}

interface SocialIconsProps {
  links: SocialLink[];
  className?: string;
  iconClassName?: string;
}

export function SocialIcons({ links, className, iconClassName = "size-4" }: SocialIconsProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link) => (
        <a
          key={link.rede}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="inline-flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
        >
          <SocialIcon rede={link.rede} className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
