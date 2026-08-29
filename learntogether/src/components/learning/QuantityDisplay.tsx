import type { LearningItem } from "@/types";

export interface QuantityDisplayProps {
  item: LearningItem;
  /** Emoji size in pixels. Shrinks automatically for larger counts. */
  size?: number;
}

/**
 * Shows "how many" for a number lesson: the counter emoji repeated `value`
 * times, in a steady grid so the learner can count along by touch or by eye.
 */
export function QuantityDisplay({ item, size }: QuantityDisplayProps) {
  const count = Number(item.value);

  if (count === 0) {
    return (
      <p className="rounded-image bg-surface-sunken px-6 py-5 text-center text-xl font-semibold text-ink-muted">
        Nothing here. Zero means none.
      </p>
    );
  }

  // Larger counts need smaller glyphs to stay on one screen without scrolling.
  const glyphSize = size ?? (count <= 5 ? 52 : count <= 10 ? 42 : 32);

  return (
    <ul
      aria-label={`${item.writtenWord ?? item.value} items`}
      className="flex flex-wrap justify-center gap-2 rounded-image bg-surface-sunken px-4 py-5"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index} aria-hidden="true" style={{ fontSize: glyphSize, lineHeight: 1 }}>
          {item.emoji}
        </li>
      ))}
    </ul>
  );
}
