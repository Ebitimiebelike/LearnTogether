"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "success" | "reward" | "quiet";
export type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary shadow-card active:bg-primary-strong",
  secondary:
    "bg-surface text-ink border-2 border-border-subtle shadow-card active:bg-surface-sunken",
  success: "bg-success text-on-success shadow-card",
  reward: "bg-reward text-on-reward shadow-card",
  quiet: "bg-transparent text-ink-muted",
};

const SIZES: Record<ButtonSize, string> = {
  // Never below the 56px minimum touch target.
  md: "min-h-touch px-6 text-lg gap-3",
  lg: "min-h-[76px] px-8 text-2xl gap-4",
};

const BASE =
  "inline-flex items-center justify-center rounded-button font-bold " +
  "transition-transform duration-150 active:scale-[0.97] disabled:opacity-50 " +
  "disabled:active:scale-100 select-none text-center";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Places the icon after the label instead of before it. */
  iconAfter?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
}

function content(icon: IconName | undefined, iconAfter: boolean, children: ReactNode, size: ButtonSize) {
  const glyph = icon ? <Icon name={icon} size={size === "lg" ? 32 : 26} /> : null;
  return (
    <>
      {!iconAfter && glyph}
      {children}
      {iconAfter && glyph}
    </>
  );
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconAfter = false,
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {content(icon, iconAfter, children, size)}
    </button>
  );
}

export interface ButtonLinkProps extends CommonProps {
  href: string;
  "aria-label"?: string;
}

/** A link styled as a button. Used for navigation so it stays keyboard-native. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  iconAfter = false,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {content(icon, iconAfter, children, size)}
    </Link>
  );
}
