"use client";

import { useMemo, useState } from "react";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { MatchGame } from "@/components/games/MatchGame";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils/cn";

/**
 * Games.
 *
 * One game in the MVP: tap-to-select matching, in a letters mode (A → Apple)
 * and a numbers mode (3 → three objects).
 */
export default function GamesPage() {
  const [mode, setMode] = useState<"letters" | "numbers">("letters");

  // Numbers here must be countable at a glance, so the game uses 1–6 rather
  // than the full 0–20 range the lessons cover.
  const numberPool = useMemo(
    () => NUMBERS.filter((item) => Number(item.value) >= 1 && Number(item.value) <= 6),
    [],
  );

  return (
    <>
      <PageHeader title="Matching" subtitle="Tap one, then tap its match" showBack={false} />

      <div className="px-5 pb-5">
        <div
          role="group"
          aria-label="What to match"
          className="flex gap-3 rounded-card bg-surface-sunken p-2"
        >
          {(["letters", "numbers"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={cn(
                "min-h-touch flex-1 rounded-button text-lg font-bold capitalize transition-colors",
                mode === option
                  ? "bg-primary text-on-primary shadow-card"
                  : "text-ink-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <MatchGame
        key={mode}
        pool={mode === "letters" ? ALPHABET : numberPool}
        title={
          mode === "letters"
            ? "Match each letter to its picture"
            : "Match each number to how many"
        }
      />
    </>
  );
}
