/**
 * How a learner's progress on a single item advances.
 *
 * Mastery is deliberately generous: a learner who keeps returning to an item
 * moves forward, and a wrong answer never moves them backwards. The app has no
 * concept of "failing" an item.
 */
import type { ActivityKind, LearningItem, MasteryStatus, Progress } from "@/types";

/** Correct answers needed before an item can count as mastered. */
export const MASTERY_SUCCESSES = 4;
/** ...and the share of attempts that must have been correct. */
export const MASTERY_RATE = 0.6;
/** Traces needed before tracing alone can carry an item to mastered. */
export const MASTERY_TRACES = 3;

export function emptyProgress(learnerId: string, itemId: string): Progress {
  return {
    learnerId,
    itemId,
    status: "new",
    attempts: 0,
    successes: 0,
    traceCount: 0,
    lastPracticedAt: 0,
  };
}

/** Derives the status from the counters. Status is never set directly. */
export function deriveStatus(progress: Progress): MasteryStatus {
  const { attempts, successes, traceCount } = progress;
  const rate = attempts === 0 ? 0 : successes / attempts;

  if (successes >= MASTERY_SUCCESSES && rate >= MASTERY_RATE) return "mastered";
  if (successes >= 2 && traceCount >= MASTERY_TRACES) return "mastered";
  if (attempts > 0 || traceCount > 0) return "practicing";
  if (progress.lastPracticedAt > 0) return "introduced";
  return "new";
}

export interface ActivityOutcome {
  kind: ActivityKind;
  /** Omitted for activities that cannot be wrong, such as viewing a lesson. */
  correct?: boolean;
  at: number;
}

/**
 * Returns the progress record that results from one activity. Pure: the input
 * is never mutated, so this is safe to use inside React state updates.
 */
export function applyActivity(
  current: Progress | undefined,
  learnerId: string,
  itemId: string,
  outcome: ActivityOutcome,
): Progress {
  const base = current ?? emptyProgress(learnerId, itemId);

  const next: Progress = {
    ...base,
    learnerId,
    itemId,
    lastPracticedAt: outcome.at,
    traceCount: base.traceCount + (outcome.kind === "trace" ? 1 : 0),
    attempts: base.attempts + (outcome.correct === undefined ? 0 : 1),
    successes: base.successes + (outcome.correct === true ? 1 : 0),
  };

  return { ...next, status: deriveStatus(next) };
}

export interface CategorySummary {
  total: number;
  /** Seen at least once but not yet practised. */
  introduced: number;
  practicing: number;
  mastered: number;
  /** Never opened. */
  notStarted: number;
  /** How many characters have been traced at least once. */
  traced: number;
}

/** Counts each status across one category's items. */
export function summarise(
  items: LearningItem[],
  progress: Progress[],
): CategorySummary {
  const byItem = new Map(progress.map((record) => [record.itemId, record]));
  const summary: CategorySummary = {
    total: items.length,
    introduced: 0,
    practicing: 0,
    mastered: 0,
    notStarted: 0,
    traced: 0,
  };

  for (const item of items) {
    const record = byItem.get(item.id);
    if (record && record.traceCount > 0) summary.traced++;
    switch (record?.status ?? "new") {
      case "mastered":
        summary.mastered++;
        break;
      case "practicing":
        summary.practicing++;
        break;
      case "introduced":
        summary.introduced++;
        break;
      default:
        summary.notStarted++;
    }
  }

  return summary;
}

/** 0–1: how far through a category the learner is. Mastery counts double. */
export function completionRatio(summary: CategorySummary): number {
  if (summary.total === 0) return 0;
  const earned = summary.mastered * 2 + summary.practicing + summary.introduced * 0.5;
  return Math.min(1, earned / (summary.total * 2));
}

/**
 * Items the learner is finding hardest, worst first.
 *
 * Used by the caregiver dashboard and to bias practice towards what needs work.
 * Mastered items are excluded; items that have been attempted and missed rank
 * above items that have simply not been tried much.
 */
export function itemsNeedingPractice(
  items: LearningItem[],
  progress: Progress[],
  limit = 5,
): LearningItem[] {
  const byItem = new Map(progress.map((record) => [record.itemId, record]));

  return items
    .map((item) => ({ item, record: byItem.get(item.id) }))
    .filter(({ record }) => record && record.status !== "mastered" && record.attempts > 0)
    .map(({ item, record }) => ({
      item,
      // Lower success rate first; break ties with more attempts.
      rate: record!.successes / record!.attempts,
      attempts: record!.attempts,
    }))
    .sort((a, b) => a.rate - b.rate || b.attempts - a.attempts)
    .slice(0, limit)
    .map(({ item }) => item);
}

/** The next item to introduce: the first one never opened, in lesson order. */
export function nextUnseenItem(
  items: LearningItem[],
  progress: Progress[],
): LearningItem | undefined {
  const seen = new Set(
    progress.filter((record) => record.status !== "new").map((record) => record.itemId),
  );
  return items.find((item) => !seen.has(item.id));
}
