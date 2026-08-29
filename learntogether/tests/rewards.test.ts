import { describe, expect, it } from "vitest";
import {
  awardStars,
  badgesForStars,
  emptyRewardState,
  nextBadge,
  progressToNextBadge,
  starsFor,
  STARS_PER_ACTIVITY,
  updateStreak,
} from "@/features/rewards/rewards";
import { BADGES } from "@/data/badges";

const LEARNER = "learner-1";

describe("starsFor", () => {
  it("gives more for tracing than for anything else", () => {
    expect(starsFor("trace")).toBeGreaterThan(starsFor("identify"));
  });

  it("gives nothing for a wrong answer, but never takes any away", () => {
    expect(starsFor("identify", false)).toBe(0);
  });

  it("gives the full amount for a correct answer", () => {
    expect(starsFor("identify", true)).toBe(STARS_PER_ACTIVITY.identify);
  });

  it("gives stars for activities that cannot be wrong", () => {
    expect(starsFor("lesson")).toBe(STARS_PER_ACTIVITY.lesson);
  });
});

describe("updateStreak", () => {
  const base = { ...emptyRewardState(LEARNER), streak: 3, lastActiveDate: "2026-03-10" };

  it("leaves the streak alone on the same day", () => {
    expect(updateStreak(base, "2026-03-10").streak).toBe(3);
  });

  it("adds one on the following day", () => {
    expect(updateStreak(base, "2026-03-11").streak).toBe(4);
  });

  it("restarts at one after a gap", () => {
    expect(updateStreak(base, "2026-03-15").streak).toBe(1);
  });

  it("starts at one for a learner with no history", () => {
    expect(updateStreak(emptyRewardState(LEARNER), "2026-03-10").streak).toBe(1);
  });

  it("handles a month boundary", () => {
    const endOfMonth = { ...base, lastActiveDate: "2026-03-31" };
    expect(updateStreak(endOfMonth, "2026-04-01").streak).toBe(4);
  });
});

describe("awardStars", () => {
  const day = new Date(2026, 2, 10);

  it("adds stars and records the day", () => {
    const { state } = awardStars(emptyRewardState(LEARNER), 3, day);
    expect(state.stars).toBe(3);
    expect(state.lastActiveDate).toBe("2026-03-10");
    expect(state.streak).toBe(1);
  });

  it("unlocks the first badge with the first star", () => {
    const { state, newBadges } = awardStars(emptyRewardState(LEARNER), 1, day);
    expect(newBadges.map((badge) => badge.id)).toContain("first-star");
    expect(state.badges).toContain("first-star");
  });

  it("only reports each badge as new once", () => {
    const first = awardStars(emptyRewardState(LEARNER), 1, day);
    const second = awardStars(first.state, 1, day);
    expect(second.newBadges).toEqual([]);
    expect(second.state.badges).toEqual(["first-star"]);
  });

  it("can unlock several badges from one large award", () => {
    const { newBadges } = awardStars(emptyRewardState(LEARNER), 20, day);
    expect(newBadges.length).toBeGreaterThan(1);
  });

  it("never subtracts stars, even if asked to", () => {
    const start = { ...emptyRewardState(LEARNER), stars: 10 };
    expect(awardStars(start, -5, day).state.stars).toBe(10);
  });

  it("does not mutate the state it is given", () => {
    const start = emptyRewardState(LEARNER);
    const snapshot = { ...start };
    awardStars(start, 5, day);
    expect(start).toEqual(snapshot);
  });
});

describe("badges", () => {
  it("unlocks badges in ascending star order", () => {
    const thresholds = BADGES.map((badge) => badge.requiredStars);
    expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
  });

  it("returns exactly the badges earned so far", () => {
    expect(badgesForStars(0)).toEqual([]);
    expect(badgesForStars(5).map((badge) => badge.id)).toEqual([
      "first-star",
      "getting-started",
    ]);
  });

  it("points at the next badge to aim for", () => {
    expect(nextBadge(0)?.id).toBe("first-star");
    expect(nextBadge(1)?.id).toBe("getting-started");
  });

  it("has no next badge once every one is unlocked", () => {
    const everything = BADGES.at(-1)!.requiredStars;
    expect(nextBadge(everything)).toBeUndefined();
    expect(progressToNextBadge(everything)).toBe(1);
  });

  it("measures progress between the previous badge and the next", () => {
    // Between "first-star" (1) and "getting-started" (5): 3 stars is halfway.
    expect(progressToNextBadge(3)).toBeCloseTo(0.5, 5);
  });
});
