/**
 * Stars, badges and streaks.
 *
 * Stars are only ever added — nothing the learner does can take one away. The
 * streak counts days with any activity, and simply restarts at 1 after a gap
 * rather than being framed as something lost.
 */
import { BADGES } from "@/data/badges";
import type { ActivityKind, Badge, RewardState } from "@/types";
import { previousDateKey, toDateKey } from "@/lib/utils/date";

/** Stars earned per completed activity. Tracing is worth more: it is the hardest. */
export const STARS_PER_ACTIVITY: Record<ActivityKind, number> = {
  lesson: 1,
  trace: 2,
  identify: 1,
  listen: 1,
  match: 1,
};

export function emptyRewardState(learnerId: string): RewardState {
  return { learnerId, stars: 0, badges: [], streak: 0, lastActiveDate: null };
}

/** Stars for one activity. Incorrect answers still earn nothing, but cost nothing. */
export function starsFor(kind: ActivityKind, correct?: boolean): number {
  if (correct === false) return 0;
  return STARS_PER_ACTIVITY[kind];
}

/** Every badge unlocked at a given star total. */
export function badgesForStars(stars: number): Badge[] {
  return BADGES.filter((badge) => badge.requiredStars <= stars);
}

/** The next badge to aim for, or undefined once they are all unlocked. */
export function nextBadge(stars: number): Badge | undefined {
  return BADGES.find((badge) => badge.requiredStars > stars);
}

/**
 * Advances the streak for a day with activity.
 *
 * Same day: unchanged. The day after: +1. Any longer gap: back to 1.
 */
export function updateStreak(state: RewardState, todayKey: string): RewardState {
  if (state.lastActiveDate === todayKey) return state;
  const continued = state.lastActiveDate === previousDateKey(todayKey);
  return {
    ...state,
    streak: continued ? state.streak + 1 : 1,
    lastActiveDate: todayKey,
  };
}

export interface AwardResult {
  state: RewardState;
  /** Badges unlocked by this award, so the UI can celebrate them. */
  newBadges: Badge[];
}

/**
 * Adds stars, refreshes the streak and unlocks any badges reached. Pure.
 */
export function awardStars(
  state: RewardState,
  stars: number,
  now: Date = new Date(),
): AwardResult {
  const withStreak = updateStreak(state, toDateKey(now));
  const total = withStreak.stars + Math.max(0, stars);

  const unlocked = badgesForStars(total);
  const newBadges = unlocked.filter((badge) => !withStreak.badges.includes(badge.id));

  return {
    state: {
      ...withStreak,
      stars: total,
      badges: unlocked.map((badge) => badge.id),
    },
    newBadges,
  };
}

/** 0–1 progress towards the next badge, for the rewards progress bar. */
export function progressToNextBadge(stars: number): number {
  const target = nextBadge(stars);
  if (!target) return 1;
  const previous = [...BADGES]
    .reverse()
    .find((badge) => badge.requiredStars <= stars)?.requiredStars ?? 0;
  const span = target.requiredStars - previous;
  return span === 0 ? 1 : (stars - previous) / span;
}
