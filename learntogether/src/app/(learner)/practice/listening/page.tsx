"use client";

import { useState } from "react";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { PageHeader } from "@/components/ui/PageHeader";
import { PracticeActivity } from "@/features/practice/PracticeActivity";
import { cn } from "@/lib/utils/cn";

/**
 * Listen and choose.
 *
 * The same exercise as identification, but with no text clue: the target is
 * only ever spoken, so this practises listening rather than matching shapes.
 * Available for both letters and numbers.
 */
export default function ListeningPage() {
  const [pool, setPool] = useState<"letters" | "numbers">("letters");

  return (
    <>
      <PageHeader title="Listen and choose" backHref="/practice" />

      <div className="px-5 pb-5">
        <div
          role="group"
          aria-label="What to practise"
          className="flex gap-3 rounded-card bg-surface-sunken p-2"
        >
          {(["letters", "numbers"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPool(option)}
              aria-pressed={pool === option}
              className={cn(
                "min-h-touch flex-1 rounded-button text-lg font-bold capitalize transition-colors",
                pool === option
                  ? "bg-primary text-on-primary shadow-card"
                  : "text-ink-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Keyed so switching pool starts a clean round rather than mixing them. */}
      <PracticeActivity
        key={pool}
        pool={pool === "letters" ? ALPHABET : NUMBERS}
        mode="listen"
        doneHref="/practice"
      />
    </>
  );
}
