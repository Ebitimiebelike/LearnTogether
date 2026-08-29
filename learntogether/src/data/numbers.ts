/**
 * Number lesson content, 0–20.
 *
 * As with the alphabet, every number screen renders from this array. Extending
 * the range to 100 later means appending seeds here, not editing components.
 */
import type { LearningItem } from "@/types";

const WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
  "Twenty",
];

/**
 * The object repeated to show "how many". Rotating through a few familiar
 * objects keeps counting screens interesting without adding new concepts.
 */
const COUNTERS = ["🍎", "⭐", "🐟", "🌸", "🚗", "🍊"];

export const NUMBERS: LearningItem[] = WORDS.map((word, value) => ({
  id: `number-${value}`,
  category: "number",
  value: String(value),
  displayValue: String(value),
  writtenWord: word,
  // Zero is shown as an empty set, so it gets a neutral marker rather than a counter.
  emoji: value === 0 ? "⬜" : COUNTERS[value % COUNTERS.length],
  soundHint: `${word}.`,
  // Five numbers per level: 0–4, 5–9, 10–14, 15–20.
  level: Math.min(Math.floor(value / 5) + 1, 4),
}));

const BY_VALUE = new Map(NUMBERS.map((item) => [item.value, item]));

export function getNumber(value: string | number): LearningItem | undefined {
  return BY_VALUE.get(String(value));
}

/** Route params, e.g. /learn/numbers/3. */
export const NUMBER_SLUGS = NUMBERS.map((item) => item.value);
