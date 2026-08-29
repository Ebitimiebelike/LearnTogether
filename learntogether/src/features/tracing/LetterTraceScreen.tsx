"use client";

import { useState } from "react";
import { ALPHABET } from "@/data/alphabet";
import { getLetterTrace, type TraceCase } from "@/data/tracing";
import { PageHeader } from "@/components/ui/PageHeader";
import { TraceActivity } from "./TraceActivity";
import { cn } from "@/lib/utils/cn";
import type { LearningItem } from "@/types";

export interface LetterTraceScreenProps {
  item: LearningItem;
}

const CASES: { value: TraceCase; label: string }[] = [
  { value: "uppercase", label: "Big" },
  { value: "lowercase", label: "Small" },
];

/**
 * Tracing one letter, in either case.
 *
 * "Big" and "Small" rather than "Uppercase" and "Lowercase": the words a
 * learner who cannot yet read those terms will still understand, alongside the
 * letterform itself on each button.
 */
export function LetterTraceScreen({ item }: LetterTraceScreenProps) {
  const [letterCase, setLetterCase] = useState<TraceCase>("uppercase");

  const index = ALPHABET.findIndex((entry) => entry.id === item.id);
  const next = ALPHABET[index + 1];
  const trace = getLetterTrace(item.value, letterCase);

  if (!trace) return null;

  return (
    <>
      <PageHeader
        title={`Trace ${item.value}`}
        subtitle={`${index + 1} of ${ALPHABET.length}`}
        backHref="/trace/letters"
      />

      <TraceActivity
        item={item}
        character={trace.character}
        strokes={trace.strokes}
        nextHref={next ? `/trace/letters/${next.lowercase}` : null}
        finishHref="/trace/letters"
        toolbar={
          <div
            role="group"
            aria-label="Letter shape"
            className="flex gap-3 rounded-card bg-surface-sunken p-2"
          >
            {CASES.map((option) => {
              const selected = letterCase === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLetterCase(option.value)}
                  aria-pressed={selected}
                  className={cn(
                    "flex min-h-touch flex-1 items-center justify-center gap-3 rounded-button text-lg font-bold transition-colors",
                    selected ? "bg-primary text-on-primary shadow-card" : "text-ink-muted",
                  )}
                >
                  <span aria-hidden="true" className="text-2xl">
                    {option.value === "uppercase" ? item.value : item.lowercase}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        }
      />
    </>
  );
}
