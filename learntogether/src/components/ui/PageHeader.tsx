"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";

export interface PageHeaderProps {
  title: string;
  /** One short line at most. Screens should not need explaining. */
  subtitle?: string;
  /** Hidden on the top-level screens the bottom navigation already reaches. */
  showBack?: boolean;
  /** Where Back goes. Defaults to browser history. */
  backHref?: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backHref,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center gap-4 px-5 pt-5 pb-3">
      {showBack && (
        <IconButton
          icon="back"
          label="Go back"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
        />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-base text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
