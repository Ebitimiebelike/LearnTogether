"use client";

import { cn } from "@/lib/utils/cn";
import type { Badge } from "@/types";

export interface CelebrationProps {
  show: boolean;
  message: string;
  starsAwarded?: number;
  newBadges?: Badge[];
  className?: string;
}

/**
 * The reward moment.
 *
 * Deliberately restrained: a few emoji that drift up once and stop. No
 * flashing, no strobing, no rapid colour changes, and the whole thing respects
 * `prefers-reduced-motion` through the shared animation rules.
 */
export function Celebration({
  show,
  message,
  starsAwarded = 0,
  newBadges = [],
  className,
}: CelebrationProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center gap-3 rounded-card bg-success-soft px-6 py-6 text-center animate-pop",
        className,
      )}
    >
      <div aria-hidden="true" className="flex gap-3 text-5xl">
        {["🎉", "⭐", "🎈"].map((emoji, index) => (
          <span
            key={emoji}
            className="animate-float"
            // Small offsets so they drift gently rather than in lockstep.
            style={{ animationDelay: `${index * 220}ms` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <p className="text-2xl font-extrabold">{message}</p>

      {starsAwarded > 0 && (
        <p className="text-xl font-bold text-ink-muted">
          {starsAwarded === 1 ? "You earned 1 star" : `You earned ${starsAwarded} stars`}
        </p>
      )}

      {newBadges.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-3">
          {newBadges.map((badge) => (
            <li
              key={badge.id}
              className="flex items-center gap-2 rounded-full bg-reward px-4 py-2 text-lg font-bold text-on-reward"
            >
              <span aria-hidden="true">{badge.emoji}</span>
              New badge: {badge.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
