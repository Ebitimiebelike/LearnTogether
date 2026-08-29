import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export interface StarCountProps {
  stars: number;
  size?: "sm" | "lg";
  className?: string;
}

export function StarCount({ stars, size = "sm", className }: StarCountProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-reward-soft font-extrabold text-on-reward",
        size === "lg" ? "px-5 py-3 text-3xl" : "px-4 py-2 text-lg",
        className,
      )}
    >
      <Icon name="star" size={size === "lg" ? 34 : 24} className="text-reward" />
      <span>{stars}</span>
      <span className="sr-only">stars</span>
    </span>
  );
}
