"use client";

import { LessonCard } from "./LessonCard";
import { useProgressList } from "@/features/learners/SessionProvider";
import { useAudio } from "@/hooks/useAudio";
import type { LearningItem, MasteryStatus } from "@/types";
import { useMemo } from "react";

export interface LessonGridProps {
  items: LearningItem[];
  /** Where tapping a tile goes. */
  hrefFor: (item: LearningItem) => string;
  /** Grid columns at the smallest size. Letters use 4, numbers 3. */
  columns?: 3 | 4;
}

/**
 * The alphabet and number grids.
 *
 * Tapping a tile pronounces the character as well as opening its lesson, which
 * is what the spec asks for and what a learner expects from one tap.
 */
export function LessonGrid({ items, hrefFor, columns = 4 }: LessonGridProps) {
  const audio = useAudio();
  const progress = useProgressList();

  const statusById = useMemo(() => {
    const map = new Map<string, MasteryStatus>();
    for (const record of progress) map.set(record.itemId, record.status);
    return map;
  }, [progress]);

  return (
    <ul
      className={
        columns === 4
          ? "grid grid-cols-4 gap-3 px-5 pb-8 sm:grid-cols-6"
          : "grid grid-cols-3 gap-3 px-5 pb-8 sm:grid-cols-5"
      }
    >
      {items.map((item) => (
        <li key={item.id}>
          <LessonCard
            item={item}
            href={hrefFor(item)}
            status={statusById.get(item.id) ?? "new"}
            onPreview={() => void audio.speakItem(item)}
          />
        </li>
      ))}
    </ul>
  );
}
