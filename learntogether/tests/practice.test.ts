import { describe, expect, it } from "vitest";
import {
  buildMatchRound,
  buildQuestion,
  buildSession,
  clampChoiceCount,
  DEFAULT_CHOICE_COUNT,
  MAX_CHOICE_COUNT,
  MIN_CHOICE_COUNT,
  selectTarget,
} from "@/features/practice/questions";
import { ALPHABET, getLetter } from "@/data/alphabet";
import { NUMBERS, getNumber } from "@/data/numbers";
import { emptyProgress } from "@/features/progress/mastery";
import { shuffle, sample, pickOne } from "@/lib/utils/random";
import type { Progress } from "@/types";

/** A deterministic RNG, so a failing test always fails the same way. */
function seededRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function progress(itemId: string, overrides: Partial<Progress> = {}): Progress {
  return { ...emptyProgress("learner-1", itemId), ...overrides };
}

describe("shuffle and sample", () => {
  it("keeps every element", () => {
    const shuffled = shuffle([1, 2, 3, 4, 5], seededRng(1));
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3];
    shuffle(input, seededRng(2));
    expect(input).toEqual([1, 2, 3]);
  });

  it("samples distinct items", () => {
    const picked = sample([1, 2, 3, 4, 5], 3, seededRng(3));
    expect(new Set(picked).size).toBe(3);
  });

  it("returns everything when asked for more than exists", () => {
    expect(sample([1, 2], 10, seededRng(4))).toHaveLength(2);
  });

  it("always picks a real element", () => {
    const rng = seededRng(5);
    for (let i = 0; i < 50; i++) {
      expect([1, 2, 3]).toContain(pickOne([1, 2, 3], rng));
    }
  });
});

describe("clampChoiceCount", () => {
  it("keeps difficulty inside the supported range", () => {
    expect(clampChoiceCount(1)).toBe(MIN_CHOICE_COUNT);
    expect(clampChoiceCount(99)).toBe(MAX_CHOICE_COUNT);
    expect(clampChoiceCount(3)).toBe(3);
  });
});

describe("buildQuestion", () => {
  it("includes the target exactly once, marked correct", () => {
    const target = getLetter("A")!;
    const question = buildQuestion(target, ALPHABET, 3, seededRng(7));

    const correct = question.choices.filter((choice) => choice.isCorrect);
    expect(correct).toHaveLength(1);
    expect(correct[0].item.id).toBe(target.id);
  });

  it("produces the requested number of choices", () => {
    for (const count of [2, 3, 4]) {
      const question = buildQuestion(getLetter("M")!, ALPHABET, count, seededRng(count));
      expect(question.choices).toHaveLength(count);
    }
  });

  it("never repeats an option", () => {
    const question = buildQuestion(getLetter("M")!, ALPHABET, 4, seededRng(8));
    const ids = question.choices.map((choice) => choice.item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("phrases the letter prompt as 'Find A.'", () => {
    expect(buildQuestion(getLetter("A")!, ALPHABET, 3, seededRng(9)).prompt).toBe(
      "Find A.",
    );
  });

  it("uses the spoken word for numbers, not the digit", () => {
    expect(buildQuestion(getNumber(5)!, NUMBERS, 3, seededRng(10)).prompt).toBe(
      "Find Five.",
    );
  });

  it("hides the answer in listening mode", () => {
    const question = buildQuestion(
      getLetter("B")!,
      ALPHABET,
      3,
      seededRng(11),
      "listen",
    );
    expect(question.prompt).toBe("Listen, then choose.");
    expect(question.prompt).not.toContain("B");
  });

  it("copes with a pool barely larger than the choice count", () => {
    const tiny = ALPHABET.slice(0, 2);
    const question = buildQuestion(tiny[0], tiny, 3, seededRng(12));
    // Only one distractor exists, so the question is as large as it can be.
    expect(question.choices).toHaveLength(2);
    expect(question.choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
  });

  it("draws distractors from near the target in lesson order", () => {
    const question = buildQuestion(getLetter("B")!, ALPHABET, 3, seededRng(13));
    const indexes = question.choices.map((choice) =>
      ALPHABET.findIndex((item) => item.id === choice.item.id),
    );
    // Neighbours, not letters from the far end of the alphabet.
    expect(Math.max(...indexes)).toBeLessThan(10);
  });
});

describe("selectTarget", () => {
  it("returns an item from the pool when there is no history", () => {
    expect(ALPHABET).toContain(selectTarget(ALPHABET, [], seededRng(14)));
  });

  it("favours items the learner is finding hard", () => {
    const records = ALPHABET.map((item) =>
      progress(item.id, {
        status: item.value === "Q" ? "practicing" : "mastered",
        attempts: item.value === "Q" ? 8 : 5,
        successes: item.value === "Q" ? 1 : 5,
      }),
    );

    const rng = seededRng(15);
    const picks = Array.from({ length: 200 }, () =>
      selectTarget(ALPHABET, records, rng),
    );
    const qCount = picks.filter((item) => item.value === "Q").length;
    // Roughly two thirds of the time, allowing for the random third.
    expect(qCount).toBeGreaterThan(100);
  });
});

describe("buildSession", () => {
  it("builds the requested number of questions", () => {
    expect(buildSession(ALPHABET, [], 5, DEFAULT_CHOICE_COUNT, seededRng(16))).toHaveLength(
      5,
    );
  });

  it("gives every question a valid target and choices", () => {
    const session = buildSession(NUMBERS, [], 8, 3, seededRng(17));
    for (const question of session) {
      expect(question.choices).toHaveLength(3);
      expect(
        question.choices.some((choice) => choice.item.id === question.target.id),
      ).toBe(true);
    }
  });

  it("is deterministic for a given seed", () => {
    const first = buildSession(ALPHABET, [], 6, 3, seededRng(18));
    const second = buildSession(ALPHABET, [], 6, 3, seededRng(18));
    expect(first.map((q) => q.target.id)).toEqual(second.map((q) => q.target.id));
  });

  it("mostly avoids asking the same thing twice in a row", () => {
    const session = buildSession(ALPHABET, [], 30, 3, seededRng(19));
    const repeats = session.filter(
      (question, index) => index > 0 && question.target.id === session[index - 1].target.id,
    );
    expect(repeats.length).toBeLessThanOrEqual(1);
  });
});

describe("buildMatchRound", () => {
  it("puts the same items on both sides", () => {
    const { left, right } = buildMatchRound(ALPHABET, 3, seededRng(20));
    expect(left).toHaveLength(3);
    expect(new Set(right.map((item) => item.id))).toEqual(
      new Set(left.map((item) => item.id)),
    );
  });

  it("does not repeat an item within a round", () => {
    const { left } = buildMatchRound(ALPHABET, 4, seededRng(21));
    expect(new Set(left.map((item) => item.id)).size).toBe(4);
  });

  it("shrinks to fit a small pool", () => {
    expect(buildMatchRound(ALPHABET.slice(0, 2), 5, seededRng(22)).left).toHaveLength(2);
  });
});
