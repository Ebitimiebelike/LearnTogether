/**
 * Works out what "Continue learning" should do.
 *
 * The rule is simple and predictable, which matters more than being clever:
 * introduce the next letter, then the next number, and once both alphabets are
 * covered, revisit whatever needs the most practice.
 */
import type { LearningItem, Progress } from "@/types";
import { itemsNeedingPractice, nextUnseenItem } from "./mastery";

export interface ContinueSuggestion {
  item: LearningItem;
  href: string;
  /** Short label for the card, e.g. "Letter C". */
  label: string;
  /** Why it was chosen, shown as one quiet line. */
  reason: string;
}

function hrefFor(item: LearningItem): string {
  return item.category === "letter"
    ? `/learn/alphabet/${item.lowercase}`
    : `/learn/numbers/${item.value}`;
}

function labelFor(item: LearningItem): string {
  return item.category === "letter"
    ? `Letter ${item.value}`
    : `Number ${item.displayValue}`;
}

export function nextActivity(
  letters: LearningItem[],
  numbers: LearningItem[],
  progress: Progress[],
): ContinueSuggestion {
  const nextLetter = nextUnseenItem(letters, progress);
  if (nextLetter) {
    return {
      item: nextLetter,
      href: hrefFor(nextLetter),
      label: labelFor(nextLetter),
      reason: "Next new letter",
    };
  }

  const nextNumber = nextUnseenItem(numbers, progress);
  if (nextNumber) {
    return {
      item: nextNumber,
      href: hrefFor(nextNumber),
      label: labelFor(nextNumber),
      reason: "Next new number",
    };
  }

  const needsWork = itemsNeedingPractice([...letters, ...numbers], progress, 1)[0];
  if (needsWork) {
    return {
      item: needsWork,
      href: hrefFor(needsWork),
      label: labelFor(needsWork),
      reason: "Worth another look",
    };
  }

  // Everything is mastered: go back to the beginning rather than dead-ending.
  const first = letters[0];
  return {
    item: first,
    href: hrefFor(first),
    label: labelFor(first),
    reason: "Start again from A",
  };
}
