"use client";

import { getAvatar } from "@/data/avatars";
import { cn } from "@/lib/utils/cn";

export interface AvatarCardProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
  /** Renders as a button when provided; used on the avatar chooser. */
  onSelect?: () => void;
  selected?: boolean;
  className?: string;
}

const SIZES = {
  sm: "size-touch text-3xl",
  md: "size-20 text-4xl",
  lg: "size-28 text-6xl",
} as const;

export function AvatarCard({
  avatarId,
  size = "md",
  onSelect,
  selected = false,
  className,
}: AvatarCardProps) {
  const avatar = getAvatar(avatarId);

  const inner = (
    <span
      className={cn(
        "flex items-center justify-center rounded-full",
        // The tint is decorative; it always sits behind an emoji, never text.
        avatar.background,
        SIZES[size],
      )}
    >
      <span aria-hidden="true">{avatar.emoji}</span>
    </span>
  );

  if (!onSelect) {
    return (
      <span className={className} role="img" aria-label={avatar.label}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={avatar.label}
      className={cn(
        "flex flex-col items-center gap-2 rounded-card p-3 transition-transform duration-150 active:scale-95",
        selected ? "bg-primary-soft ring-4 ring-primary" : "bg-surface shadow-card",
        className,
      )}
    >
      {inner}
      <span className="text-base font-semibold">{avatar.label}</span>
    </button>
  );
}
