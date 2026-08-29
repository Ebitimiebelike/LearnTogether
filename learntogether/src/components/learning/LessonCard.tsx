"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { LearningItem, MasteryStatus } from "@/types";

export interface LessonCardProps {
  item: LearningItem;
  href: string;
  status: MasteryStatus;
  /** Called when the tile itself is tapped, before navigating. */
  onPreview?: () => void;
}

/** A small status dot, with text for screen readers. */
const STATUS_LABEL: Record<MasteryStatus, string> = {
  new: "Not started",
  introduced: "Introduced",
  practicing: "Practicing",
  mastered: "Mastered",
};

const STATUS_DOT: Record<MasteryStatus, string> = {
  new: "bg-border-subtle",
  introduced: "bg-primary",
  practicing: "bg-reward",
  mastered: "bg-success",
};

/**
 * One tile in the alphabet or number grid.
 *
 * Tapping it pronounces the character *and* opens the lesson, which is what the
 * learner expects from a single tap; `onPreview` fires the audio.
 */
export function LessonCard({ item, href, status, onPreview }: LessonCardProps) {
  return (
    <Link
      href={href}
      onClick={onPreview}
      aria-label={`${item.category === "number" ? item.writtenWord ?? item.value : item.value}, ${STATUS_LABEL[status]}`}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-card bg-surface font-extrabold shadow-card transition-transform duration-150 active:scale-95",
        "text-[clamp(2.25rem,9vw,3.5rem)] leading-none",
        status === "mastered" && "ring-4 ring-success",
      )}
    >
      {item.displayValue}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-2 size-2.5 rounded-full",
          STATUS_DOT[status],
        )}
      />
    </Link>
  );
}
