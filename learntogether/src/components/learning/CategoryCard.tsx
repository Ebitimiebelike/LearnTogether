import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

export interface CategoryCardProps {
  href: string;
  title: string;
  /** One short line. Optional — the title should carry the meaning. */
  description?: string;
  icon?: IconName;
  /** A large emoji shown instead of an icon. */
  emoji?: string;
  tone?: "primary" | "success" | "reward" | "neutral";
  className?: string;
}

const TONES = {
  primary: "bg-primary-soft text-ink",
  success: "bg-success-soft text-ink",
  reward: "bg-reward-soft text-ink",
  neutral: "bg-surface text-ink",
} as const;

/**
 * A big tappable card for a whole area of the app. These are the primary
 * navigation on Home and Learn.
 */
export function CategoryCard({
  href,
  title,
  description,
  icon,
  emoji,
  tone = "neutral",
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[132px] flex-col justify-between gap-3 rounded-card p-5 shadow-card transition-transform duration-150 active:scale-[0.98]",
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="text-4xl leading-none">
        {emoji ?? (icon && <Icon name={icon} size={40} />)}
      </span>
      <span>
        <span className="block text-xl font-extrabold">{title}</span>
        {description && (
          <span className="mt-1 block text-base text-ink-muted">{description}</span>
        )}
      </span>
    </Link>
  );
}
