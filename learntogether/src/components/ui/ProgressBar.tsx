import { cn } from "@/lib/utils/cn";

export interface ProgressBarProps {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  label: string;
  /** Shown at the end of the bar, e.g. "12 of 26". */
  valueLabel?: string;
  tone?: "primary" | "success" | "reward";
  className?: string;
}

const TONES = {
  primary: "bg-primary",
  success: "bg-success",
  reward: "bg-reward",
} as const;

export function ProgressBar({
  value,
  label,
  valueLabel,
  tone = "primary",
  className,
}: ProgressBarProps) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-base font-semibold">{label}</span>
        {valueLabel && (
          <span className="text-base text-ink-muted">{valueLabel}</span>
        )}
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", TONES[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
