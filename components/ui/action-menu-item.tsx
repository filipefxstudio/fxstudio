"use client";

import type { ComponentProps } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  ACTION_MENU_DESTRUCTIVE_CLASS,
  ACTION_MENU_ICON_CLASS,
  ACTION_MENU_ICONS,
  type ActionMenuIconKey,
} from "@/lib/ui/action-menu-icons";
import { cn } from "@/lib/utils";

interface ActionMenuItemProps extends ComponentProps<typeof DropdownMenuItem> {
  action: ActionMenuIconKey;
  destructive?: boolean;
}

export function ActionMenuItem({
  action,
  destructive,
  className,
  children,
  ...props
}: ActionMenuItemProps) {
  const Icon = ACTION_MENU_ICONS[action];

  return (
    <DropdownMenuItem
      className={cn(destructive && ACTION_MENU_DESTRUCTIVE_CLASS, className)}
      {...props}
    >
      <Icon className={ACTION_MENU_ICON_CLASS} />
      {children}
    </DropdownMenuItem>
  );
}

interface ActionMenuIconProps {
  action: ActionMenuIconKey;
  className?: string;
}

export function ActionMenuIcon({ action, className }: ActionMenuIconProps) {
  const Icon = ACTION_MENU_ICONS[action];
  return <Icon className={cn(ACTION_MENU_ICON_CLASS, className)} />;
}
