import { describe, expect, it } from "vitest";
import {
  buildCaregiverStats,
  buildSessions,
  SESSION_GAP_MS,
} from "@/features/caregiver/stats";
import { checkPin, isValidPinFormat, PIN_LENGTH } from "@/features/caregiver/pin";
import { ALPHABET } from "@/data/alphabet";
import { NUMBERS } from "@/data/numbers";
import { emptyProgress } from "@/features/progress/mastery";
import { formatDuration, previousDateKey, toDateKey } from "@/lib/utils/date";
import type { ActivityEvent, Progress } from "@/types";

const LEARNER = "learner-1";
const NOW = new Date(2026, 2, 10, 14, 0, 0);
const TODAY_NOON = new Date(2026, 2, 10, 12, 0, 0).getTime();
const YESTERDAY = new Date(2026, 2, 9, 12, 0, 0).getTime();

function event(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    learnerId: LEARNER,
    kind: "identify",
    itemId: "letter-a",
    correct: true,
    starsAwarded: 1,
    timestamp: TODAY_NOON,
    ...overrides,
  };
}

function progress(itemId: string, overrides: Partial<Progress> = {}): Progress {
  return { ...emptyProgress(LEARNER, itemId), ...overrides };
}

describe("buildSessions", () => {
  it("returns nothing for no activity", () => {
    expect(buildSessions([])).toEqual([]);
  });

  it("groups nearby events into one session", () => {
    const sessions = buildSessions([
      event({ timestamp: TODAY_NOON }),
      event({ timestamp: TODAY_NOON + 60_000 }),
      event({ timestamp: TODAY_NOON + 120_000 }),
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].activityCount).toBe(3);
  });

  it("splits events separated by more than the gap", () => {
    const sessions = buildSessions([
      event({ timestamp: TODAY_NOON }),
      event({ timestamp: TODAY_NOON + SESSION_GAP_MS + 1000 }),
    ]);
    expect(sessions).toHaveLength(2);
  });

  it("keeps events exactly at the gap in the same session", () => {
    const sessions = buildSessions([
      event({ timestamp: TODAY_NOON }),
      event({ timestamp: TODAY_NOON + SESSION_GAP_MS }),
    ]);
    expect(sessions).toHaveLength(1);
  });

  it("returns sessions newest first", () => {
    const sessions = buildSessions([
      event({ timestamp: YESTERDAY }),
      event({ timestamp: TODAY_NOON }),
    ]);
    expect(sessions[0].startedAt).toBe(TODAY_NOON);
  });

  it("sorts unordered input before grouping", () => {
    const sessions = buildSessions([
      event({ timestamp: TODAY_NOON + 120_000 }),
      event({ timestamp: TODAY_NOON }),
      event({ timestamp: TODAY_NOON + 60_000 }),
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].startedAt).toBe(TODAY_NOON);
  });

  it("gives a single-event session a non-zero duration", () => {
    expect(buildSessions([event()])[0].durationMs).toBeGreaterThan(0);
  });

  it("totals the stars in each session", () => {
    const sessions = buildSessions([
      event({ starsAwarded: 2 }),
      event({ timestamp: TODAY_NOON + 1000, starsAwarded: 1 }),
    ]);
    expect(sessions[0].starsEarned).toBe(3);
  });
});

describe("buildCaregiverStats", () => {
  it("is empty and safe with no activity at all", () => {
    const stats = buildCaregiverStats([], [], ALPHABET, NUMBERS, NOW);
    expect(stats).toMatchObject({
      practiceCompletedToday: 0,
      starsToday: 0,
      lettersPracticed: 0,
      numbersPracticed: 0,
      letterTraces: 0,
      numberTraces: 0,
      totalLearningTimeMs: 0,
    });
    expect(stats.recentSessions).toEqual([]);
  });

  it("counts only today's activities as today's", () => {
    const stats = buildCaregiverStats(
      [event({ timestamp: TODAY_NOON }), event({ timestamp: YESTERDAY })],
      [],
      ALPHABET,
      NUMBERS,
      NOW,
    );
    expect(stats.practiceCompletedToday).toBe(1);
    expect(stats.starsToday).toBe(1);
  });

  it("counts distinct letters and numbers practised", () => {
    const stats = buildCaregiverStats(
      [
        event({ itemId: "letter-a" }),
        event({ itemId: "letter-a" }),
        event({ itemId: "letter-b" }),
        event({ itemId: "number-3" }),
      ],
      [],
      ALPHABET,
      NUMBERS,
      NOW,
    );
    expect(stats.lettersPracticed).toBe(2);
    expect(stats.numbersPracticed).toBe(1);
  });

  it("counts letter and number traces separately", () => {
    const stats = buildCaregiverStats(
      [
        event({ kind: "trace", itemId: "letter-a" }),
        event({ kind: "trace", itemId: "letter-b" }),
        event({ kind: "trace", itemId: "number-7" }),
      ],
      [],
      ALPHABET,
      NUMBERS,
      NOW,
    );
    expect(stats.letterTraces).toBe(2);
    expect(stats.numberTraces).toBe(1);
  });

  it("surfaces the characters that need more practice", () => {
    const stats = buildCaregiverStats(
      [],
      [
        progress("letter-q", { status: "practicing", attempts: 8, successes: 1 }),
        progress("letter-a", { status: "mastered", attempts: 5, successes: 5 }),
        progress("number-13", { status: "practicing", attempts: 6, successes: 1 }),
      ],
      ALPHABET,
      NUMBERS,
      NOW,
    );
    expect(stats.lettersNeedingPractice.map((item) => item.value)).toEqual(["Q"]);
    expect(stats.numbersNeedingPractice.map((item) => item.value)).toEqual(["13"]);
  });

  it("shows at most five recent sessions", () => {
    const events = Array.from({ length: 10 }, (_, index) =>
      event({ timestamp: TODAY_NOON - index * (SESSION_GAP_MS * 2) }),
    );
    expect(buildCaregiverStats(events, [], ALPHABET, NUMBERS, NOW).recentSessions).toHaveLength(
      5,
    );
  });

  it("ignores events for items outside both catalogues", () => {
    const stats = buildCaregiverStats(
      [event({ itemId: "shape-circle" })],
      [],
      ALPHABET,
      NUMBERS,
      NOW,
    );
    expect(stats.lettersPracticed).toBe(0);
    expect(stats.numbersPracticed).toBe(0);
    // The event still counts towards today's total and session time.
    expect(stats.practiceCompletedToday).toBe(1);
  });
});

describe("caregiver PIN", () => {
  it("accepts exactly four digits", () => {
    expect(isValidPinFormat("1234")).toBe(true);
    expect(isValidPinFormat("123")).toBe(false);
    expect(isValidPinFormat("12345")).toBe(false);
    expect(isValidPinFormat("12a4")).toBe(false);
    expect(isValidPinFormat("")).toBe(false);
  });

  it("uses the documented length", () => {
    expect(isValidPinFormat("0".repeat(PIN_LENGTH))).toBe(true);
  });

  it("matches the stored PIN", () => {
    expect(checkPin("1234", "1234")).toBe(true);
    expect(checkPin("1235", "1234")).toBe(false);
  });

  it("leaves the area open when no PIN is set", () => {
    expect(checkPin("", null)).toBe(true);
    expect(checkPin("9999", null)).toBe(true);
  });
});

describe("date helpers", () => {
  it("formats a local date key", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("steps back across a month boundary", () => {
    expect(previousDateKey("2026-03-01")).toBe("2026-02-28");
  });

  it("steps back across a year boundary", () => {
    expect(previousDateKey("2026-01-01")).toBe("2025-12-31");
  });

  it("formats durations for the dashboard", () => {
    expect(formatDuration(0)).toBe("Less than a minute");
    expect(formatDuration(60_000)).toBe("1 minute");
    expect(formatDuration(5 * 60_000)).toBe("5 minutes");
    expect(formatDuration(65 * 60_000)).toBe("1 hour 5 minutes");
    expect(formatDuration(120 * 60_000)).toBe("2 hours");
  });
});
