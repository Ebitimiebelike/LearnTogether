import { cn } from "@/lib/utils/cn";
import type { Badge } from "@/types";

export interface RewardCardProps {
  badge: Badge;
  unlocked: boolean;
}

/** One badge tile on the rewards screen. Locked badges are shown, never hidden. */
export function RewardCard({ badge, unlocked }: RewardCardProps) {
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2 rounded-card p-4 text-center",
        unlocked ? "bg-reward-soft shadow-card" : "bg-surface-sunken",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("text-5xl leading-none", !unlocked && "opacity-35 grayscale")}
      >
        {badge.emoji}
      </span>
      <span className="text-lg font-extrabold">{badge.label}</span>
      <span className="text-base text-ink-muted">
        {unlocked ? badge.description : `${badge.requiredStars} stars to unlock`}
      </span>
    </li>
  );
}
