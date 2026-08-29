import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Sunken cards recede; use them for secondary information. */
  tone?: "surface" | "sunken";
  as?: "div" | "section" | "li" | "article";
}

export function Card({ children, className, tone = "surface", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-card p-5",
        tone === "surface" ? "bg-surface shadow-card" : "bg-surface-sunken",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
