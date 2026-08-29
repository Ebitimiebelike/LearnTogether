/**
 * Question generation for the identification, listening and matching activities.
 *
 * All of it is pure and takes an injectable RNG so sessions are reproducible in
 * tests. Difficulty is expressed only as the number of choices, which starts at
 * three and can be raised without touching any screen.
 */
import type { Choice, LearningItem, PracticeQuestion, Progress } from "@/types";
import { defaultRng, pickOne, sample, shuffle, type Rng } from "@/lib/utils/random";
import { itemsNeedingPractice } from "@/features/progress/mastery";

/** Starting difficulty. Two is available for a learner who needs it. */
export const DEFAULT_CHOICE_COUNT = 3;
export const MIN_CHOICE_COUNT = 2;
export const MAX_CHOICE_COUNT = 4;

export type PracticeMode = "identify" | "listen";

export function clampChoiceCount(count: number): number {
  return Math.max(MIN_CHOICE_COUNT, Math.min(MAX_CHOICE_COUNT, count));
}

function promptFor(mode: PracticeMode, target: LearningItem): string {
  if (mode === "listen") return "Listen, then choose.";
  const spoken =
    target.category === "number" ? target.writtenWord ?? target.value : target.value;
  return `Find ${spoken}.`;
}

/**
 * Builds one question: the target plus distractors drawn from the same pool.
 *
 * Distractors are picked from items *near* the target in lesson order, so the
 * choices feel related rather than arbitrary.
 */
export function buildQuestion(
  target: LearningItem,
  pool: LearningItem[],
  choiceCount: number = DEFAULT_CHOICE_COUNT,
  rng: Rng = defaultRng,
  mode: PracticeMode = "identify",
): PracticeQuestion {
  const others = pool.filter((item) => item.id !== target.id);
  const wanted = clampChoiceCount(choiceCount) - 1;

  // Prefer neighbours in the pool; fall back to the whole pool if it is small.
  const targetIndex = pool.findIndex((item) => item.id === target.id);
  const neighbours = others
    .map((item) => ({
      item,
      distance: Math.abs(pool.findIndex((candidate) => candidate.id === item.id) - targetIndex),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(wanted * 3, wanted))
    .map(({ item }) => item);

  const distractors = sample(neighbours, wanted, rng);

  const choices: Choice[] = shuffle(
    [
      { item: target, isCorrect: true },
      ...distractors.map((item) => ({ item, isCorrect: false })),
    ],
    rng,
  );

  return { target, choices, prompt: promptFor(mode, target) };
}

/**
 * Chooses what to ask about next.
 *
 * Two thirds of the time it revisits something the learner has found hard;
 * otherwise it picks from the whole pool so practice stays varied. Falls back
 * to the pool when there is no history yet.
 */
export function selectTarget(
  pool: LearningItem[],
  progress: Progress[],
  rng: Rng = defaultRng,
): LearningItem {
  const struggling = itemsNeedingPractice(pool, progress, 5);
  if (struggling.length > 0 && rng() < 0.66) return pickOne(struggling, rng);
  return pickOne(pool, rng);
}

/**
 * A session of questions, avoiding the same target twice in a row.
 *
 * There is no timer and no pass mark: a session simply ends when the learner
 * has answered `length` questions, however many tries each one took.
 */
export function buildSession(
  pool: LearningItem[],
  progress: Progress[],
  length: number,
  choiceCount: number = DEFAULT_CHOICE_COUNT,
  rng: Rng = defaultRng,
  mode: PracticeMode = "identify",
): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  let previousId: string | null = null;

  for (let index = 0; index < length; index++) {
    let target = selectTarget(pool, progress, rng);
    // One retry is enough to avoid immediate repeats without risking a loop.
    if (target.id === previousId && pool.length > 1) {
      target = selectTarget(pool, progress, rng);
    }
    previousId = target.id;
    questions.push(buildQuestion(target, pool, choiceCount, rng, mode));
  }

  return questions;
}

/** One side of a tap-to-select matching round. */
export interface MatchPair {
  item: LearningItem;
  /** What is shown on the right: the example word or the counted objects. */
  partnerLabel: string;
}

/**
 * A matching round: characters on the left, their pictures on the right.
 *
 * Deliberately tap-to-select rather than drag-and-drop, which is hard with
 * limited fine motor control.
 */
export function buildMatchRound(
  pool: LearningItem[],
  size = 3,
  rng: Rng = defaultRng,
): { left: LearningItem[]; right: LearningItem[] } {
  const chosen = sample(pool, Math.min(size, pool.length), rng);
  return { left: chosen, right: shuffle(chosen, rng) };
}
