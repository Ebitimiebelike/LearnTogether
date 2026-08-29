"use client";

import { cn } from "@/lib/utils/cn";
import type { LearningItem } from "@/types";

export type ChoiceState = "idle" | "correct" | "tryAgain";

export interface ChoiceButtonProps {
  item: LearningItem;
  state: ChoiceState;
  onSelect: () => void;
  disabled?: boolean;
}

const STATES: Record<ChoiceState, string> = {
  idle: "bg-surface text-ink border-border-subtle",
  // Success is shown in green with a check, not colour alone.
  correct: "bg-success-soft text-ink border-success",
  // "Try again" is a warm, soft tone: never a harsh red error state.
  tryAgain: "bg-gentle-soft text-ink border-gentle",
};

/**
 * A single large answer tile.
 *
 * Sized far above the 56px minimum because the whole screen is only ever two to
 * four of these, and a bigger target is easier to hit reliably.
 */
export function ChoiceButton({ item, state, onSelect, disabled }: ChoiceButtonProps) {
  const spoken =
    item.category === "number" ? item.writtenWord ?? item.value : item.value;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={spoken}
      className={cn(
        "relative flex aspect-square min-h-[112px] w-full items-center justify-center rounded-card border-4 font-extrabold shadow-card transition-transform duration-150 active:scale-95",
        "text-[clamp(3rem,14vw,6rem)] leading-none",
        STATES[state],
        state === "correct" && "animate-pop",
      )}
    >
      {item.displayValue}
      {state === "correct" && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 text-2xl"
          // The check is a redundant cue so success is not signalled by colour alone.
        >
          ✅
        </span>
      )}
    </button>
  );
}
