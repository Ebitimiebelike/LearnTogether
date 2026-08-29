import { describe, expect, it } from "vitest";
import {
  applyActivity,
  completionRatio,
  deriveStatus,
  emptyProgress,
  itemsNeedingPractice,
  nextUnseenItem,
  summarise,
} from "@/features/progress/mastery";
import { nextActivity } from "@/features/progress/continue";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import type { Progress } from "@/types";

const LEARNER = "learner-1";

function progress(overrides: Partial<Progress>): Progress {
  return { ...emptyProgress(LEARNER, "letter-a"), ...overrides };
}

describe("deriveStatus", () => {
  it("starts as new", () => {
    expect(deriveStatus(emptyProgress(LEARNER, "letter-a"))).toBe("new");
  });

  it("is introduced once seen but not yet practised", () => {
    expect(deriveStatus(progress({ lastPracticedAt: 123 }))).toBe("introduced");
  });

  it("is practicing after any attempt", () => {
    expect(deriveStatus(progress({ attempts: 1, successes: 0 }))).toBe("practicing");
  });

  it("is practicing after a trace with no attempts", () => {
    expect(deriveStatus(progress({ traceCount: 1 }))).toBe("practicing");
  });

  it("is mastered after four successes at a good rate", () => {
    expect(deriveStatus(progress({ attempts: 5, successes: 4 }))).toBe("mastered");
  });

  it("is not mastered when the success rate is too low", () => {
    // Four correct out of ten is below the 60% threshold.
    expect(deriveStatus(progress({ attempts: 10, successes: 4 }))).toBe("practicing");
  });

  it("can reach mastery through tracing plus a couple of successes", () => {
    expect(deriveStatus(progress({ attempts: 2, successes: 2, traceCount: 3 }))).toBe(
      "mastered",
    );
  });
});

describe("applyActivity", () => {
  it("creates a record for an item seen for the first time", () => {
    const result = applyActivity(undefined, LEARNER, "letter-a", {
      kind: "lesson",
      at: 1000,
    });
    expect(result).toMatchObject({
      learnerId: LEARNER,
      itemId: "letter-a",
      attempts: 0,
      successes: 0,
      status: "introduced",
      lastPracticedAt: 1000,
    });
  });

  it("counts a correct answer as an attempt and a success", () => {
    const result = applyActivity(undefined, LEARNER, "letter-a", {
      kind: "identify",
      correct: true,
      at: 1,
    });
    expect(result.attempts).toBe(1);
    expect(result.successes).toBe(1);
  });

  it("counts a wrong answer as an attempt but not a success", () => {
    const result = applyActivity(undefined, LEARNER, "letter-a", {
      kind: "identify",
      correct: false,
      at: 1,
    });
    expect(result.attempts).toBe(1);
    expect(result.successes).toBe(0);
  });

  it("increments the trace count without counting an attempt", () => {
    const result = applyActivity(undefined, LEARNER, "letter-a", {
      kind: "trace",
      at: 1,
    });
    expect(result.traceCount).toBe(1);
    expect(result.attempts).toBe(0);
  });

  it("never mutates the record it is given", () => {
    const before = progress({ attempts: 2, successes: 1 });
    const snapshot = { ...before };
    applyActivity(before, LEARNER, "letter-a", { kind: "identify", correct: true, at: 9 });
    expect(before).toEqual(snapshot);
  });

  it("never moves an item backwards after a wrong answer", () => {
    let record = emptyProgress(LEARNER, "letter-a");
    for (let i = 0; i < 6; i++) {
      record = applyActivity(record, LEARNER, "letter-a", {
        kind: "identify",
        correct: true,
        at: i,
      });
    }
    expect(record.status).toBe("mastered");

    const afterMistake = applyActivity(record, LEARNER, "letter-a", {
      kind: "identify",
      correct: false,
      at: 10,
    });
    // 6 of 7 is still above the threshold, so mastery holds.
    expect(afterMistake.status).toBe("mastered");
    expect(afterMistake.successes).toBe(6);
  });
});

describe("summarise", () => {
  it("counts every item when there is no progress at all", () => {
    const summary = summarise(ALPHABET, []);
    expect(summary.total).toBe(26);
    expect(summary.notStarted).toBe(26);
    expect(summary.mastered).toBe(0);
  });

  it("counts each status", () => {
    const records = [
      progress({ itemId: "letter-a", status: "mastered", successes: 4, attempts: 4 }),
      progress({ itemId: "letter-b", status: "practicing", attempts: 1 }),
      progress({ itemId: "letter-c", status: "introduced", lastPracticedAt: 5 }),
    ];
    const summary = summarise(ALPHABET, records);
    expect(summary).toMatchObject({
      mastered: 1,
      practicing: 1,
      introduced: 1,
      notStarted: 23,
    });
  });

  it("counts traced characters separately from status", () => {
    const records = [progress({ itemId: "letter-a", traceCount: 2, status: "practicing" })];
    expect(summarise(ALPHABET, records).traced).toBe(1);
  });
});

describe("completionRatio", () => {
  it("is 0 with nothing started and 1 when everything is mastered", () => {
    expect(completionRatio(summarise(ALPHABET, []))).toBe(0);

    const allMastered = ALPHABET.map((item) =>
      progress({ itemId: item.id, status: "mastered", attempts: 4, successes: 4 }),
    );
    expect(completionRatio(summarise(ALPHABET, allMastered))).toBe(1);
  });

  it("never exceeds 1", () => {
    const records = ALPHABET.map((item) =>
      progress({ itemId: item.id, status: "mastered", attempts: 99, successes: 99 }),
    );
    expect(completionRatio(summarise(ALPHABET, records))).toBeLessThanOrEqual(1);
  });
});

describe("itemsNeedingPractice", () => {
  it("puts the lowest success rate first", () => {
    const records = [
      progress({ itemId: "letter-a", attempts: 4, successes: 3, status: "practicing" }),
      progress({ itemId: "letter-b", attempts: 4, successes: 1, status: "practicing" }),
      progress({ itemId: "letter-c", attempts: 4, successes: 2, status: "practicing" }),
    ];
    expect(itemsNeedingPractice(ALPHABET, records, 3).map((item) => item.value)).toEqual([
      "B",
      "C",
      "A",
    ]);
  });

  it("ignores mastered items and items never attempted", () => {
    const records = [
      progress({ itemId: "letter-a", attempts: 5, successes: 5, status: "mastered" }),
      progress({ itemId: "letter-b", traceCount: 1, status: "practicing" }),
    ];
    expect(itemsNeedingPractice(ALPHABET, records, 5)).toEqual([]);
  });

  it("respects the limit", () => {
    const records = ALPHABET.map((item) =>
      progress({ itemId: item.id, attempts: 4, successes: 1, status: "practicing" }),
    );
    expect(itemsNeedingPractice(ALPHABET, records, 3)).toHaveLength(3);
  });
});

describe("nextUnseenItem", () => {
  it("returns the first item in lesson order", () => {
    expect(nextUnseenItem(ALPHABET, [])?.value).toBe("A");
  });

  it("skips items already seen", () => {
    const records = [
      progress({ itemId: "letter-a", status: "introduced" }),
      progress({ itemId: "letter-b", status: "practicing" }),
    ];
    expect(nextUnseenItem(ALPHABET, records)?.value).toBe("C");
  });

  it("returns undefined once everything is seen", () => {
    const records = ALPHABET.map((item) =>
      progress({ itemId: item.id, status: "introduced" }),
    );
    expect(nextUnseenItem(ALPHABET, records)).toBeUndefined();
  });
});

describe("nextActivity", () => {
  it("starts a brand new learner on the letter A", () => {
    const suggestion = nextActivity(ALPHABET, NUMBERS, []);
    expect(suggestion.item.value).toBe("A");
    expect(suggestion.href).toBe("/learn/alphabet/a");
  });

  it("moves on to numbers once every letter has been seen", () => {
    const records = ALPHABET.map((item) =>
      progress({ itemId: item.id, status: "introduced" }),
    );
    const suggestion = nextActivity(ALPHABET, NUMBERS, records);
    expect(suggestion.item.category).toBe("number");
    expect(suggestion.href).toBe("/learn/numbers/0");
  });

  it("revisits the weakest item once everything has been introduced", () => {
    const records = [
      ...ALPHABET.map((item) =>
        progress({
          itemId: item.id,
          status: item.value === "Q" ? "practicing" : "mastered",
          attempts: item.value === "Q" ? 6 : 5,
          successes: item.value === "Q" ? 1 : 5,
        }),
      ),
      ...NUMBERS.map((item) =>
        progress({ itemId: item.id, status: "mastered", attempts: 5, successes: 5 }),
      ),
    ];
    expect(nextActivity(ALPHABET, NUMBERS, records).item.value).toBe("Q");
  });

  it("always returns something rather than dead-ending", () => {
    const records = [...ALPHABET, ...NUMBERS].map((item) =>
      progress({ itemId: item.id, status: "mastered", attempts: 5, successes: 5 }),
    );
    expect(nextActivity(ALPHABET, NUMBERS, records).item).toBeDefined();
  });
});
