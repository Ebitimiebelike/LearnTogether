"use client";

import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

const BASE =
  "inline-flex items-center justify-center rounded-full size-touch shrink-0 " +
  "transition-transform duration-150 active:scale-95 disabled:opacity-50";

const TONES = {
  surface: "bg-surface text-ink border-2 border-border-subtle shadow-card",
  primary: "bg-primary text-on-primary shadow-card",
  quiet: "bg-transparent text-ink-muted",
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required: an icon-only control must still be announced. */
  label: string;
  tone?: keyof typeof TONES;
  size?: number;
}

export function IconButton({
  icon,
  label,
  tone = "surface",
  size = 28,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, TONES[tone], className)}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export interface IconLinkProps {
  href: string;
  icon: IconName;
  label: string;
  tone?: keyof typeof TONES;
  size?: number;
  className?: string;
}

export function IconLink({
  href,
  icon,
  label,
  tone = "surface",
  size = 28,
  className,
}: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(BASE, TONES[tone], className)}
    >
      <Icon name={icon} size={size} />
    </Link>
  );
}
