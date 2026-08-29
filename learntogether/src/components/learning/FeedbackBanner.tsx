import { cn } from "@/lib/utils/cn";

export type FeedbackTone = "success" | "encouraging" | "neutral";

export interface FeedbackBannerProps {
  tone: FeedbackTone;
  message: string;
  className?: string;
}

const TONES: Record<FeedbackTone, string> = {
  success: "bg-success-soft text-ink",
  // Warm and soft. A wrong answer is never shown as an error.
  encouraging: "bg-gentle-soft text-ink",
  neutral: "bg-surface-sunken text-ink",
};

const EMOJI: Record<FeedbackTone, string> = {
  success: "🎉",
  encouraging: "💪",
  neutral: "👀",
};

/**
 * The one place feedback text appears. `aria-live` announces it without moving
 * focus, so a learner using a screen reader is not interrupted mid-tap.
 */
export function FeedbackBanner({ tone, message, className }: FeedbackBannerProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-touch items-center justify-center gap-3 rounded-card px-5 py-4 text-center text-xl font-bold animate-rise",
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="text-2xl">
        {EMOJI[tone]}
      </span>
      {message}
    </p>
  );
}
