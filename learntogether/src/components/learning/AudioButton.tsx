"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/Icon";

export interface AudioButtonProps {
  /** What the button says when pressed. */
  onPlay: () => void | Promise<void>;
  /** Announced to screen readers, e.g. "Say the letter A". */
  label: string;
  /** Visible text. Omit for an icon-only round button. */
  children?: React.ReactNode;
  tone?: "primary" | "surface";
  className?: string;
}

/**
 * The speaker control used on every lesson screen.
 *
 * It gives a brief pressed state so the learner gets visible feedback even when
 * the device cannot speak.
 */
export function AudioButton({
  onPlay,
  label,
  children,
  tone = "primary",
  className,
}: AudioButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = async () => {
    setPressed(true);
    try {
      await onPlay();
    } finally {
      // Short, so repeated taps stay responsive.
      setTimeout(() => setPressed(false), 450);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "inline-flex min-h-touch items-center justify-center gap-3 rounded-button font-bold transition-transform duration-150 active:scale-95",
        children ? "px-6 text-lg" : "size-touch",
        tone === "primary"
          ? "bg-primary text-on-primary shadow-card"
          : "bg-surface text-ink border-2 border-border-subtle shadow-card",
        pressed && "scale-95",
        className,
      )}
    >
      <Icon name="speaker" size={30} className={cn(pressed && "animate-pop")} />
      {children}
    </button>
  );
}
