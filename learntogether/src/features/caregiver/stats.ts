/**
 * Read-only summaries for the caregiver dashboard.
 *
 * Everything here is derived from activity events and progress records that
 * already exist — no separate analytics are collected, and nothing leaves the
 * device.
 */
import type { ActivityEvent, LearningItem, Progress } from "@/types";
import { itemsNeedingPractice } from "@/features/progress/mastery";
import { startOfDay } from "@/lib/utils/date";

/**
 * Events more than this far apart are treated as separate sessions. Fifteen
 * minutes is long enough to survive a pause without splitting one sitting.
 */
export const SESSION_GAP_MS = 15 * 60 * 1000;

/**
 * Assumed length of a single activity when it reports no duration. Used so
 * total learning time is not zero for one-event sessions.
 */
const ASSUMED_ACTIVITY_MS = 30 * 1000;

export interface Session {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  activityCount: number;
  starsEarned: number;
}

export interface CaregiverStats {
  /** Activities finished since midnight. */
  practiceCompletedToday: number;
  starsToday: number;
  lettersPracticed: number;
  numbersPracticed: number;
  lettersNeedingPractice: LearningItem[];
  numbersNeedingPractice: LearningItem[];
  letterTraces: number;
  numberTraces: number;
  recentSessions: Session[];
  totalLearningTimeMs: number;
}

/**
 * Groups events into sessions, newest first.
 *
 * Where an activity recorded its own duration that is used; otherwise the span
 * between the first and last event of the session is taken, with a small floor
 * so a single-activity session still registers.
 */
export function buildSessions(events: ActivityEvent[]): Session[] {
  const ordered = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const sessions: Session[] = [];

  for (const event of ordered) {
    const current = sessions.at(-1);
    if (current && event.timestamp - current.endedAt <= SESSION_GAP_MS) {
      current.endedAt = event.timestamp;
      current.activityCount++;
      current.starsEarned += event.starsAwarded;
    } else {
      sessions.push({
        startedAt: event.timestamp,
        endedAt: event.timestamp,
        durationMs: 0,
        activityCount: 1,
        starsEarned: event.starsAwarded,
      });
    }
  }

  for (const session of sessions) {
    const span = session.endedAt - session.startedAt;
    session.durationMs = Math.max(span, session.activityCount * ASSUMED_ACTIVITY_MS);
  }

  return sessions.reverse();
}

export function buildCaregiverStats(
  events: ActivityEvent[],
  progress: Progress[],
  letters: LearningItem[],
  numbers: LearningItem[],
  now: Date = new Date(),
): CaregiverStats {
  const dayStart = startOfDay(now);
  const todaysEvents = events.filter((event) => event.timestamp >= dayStart);

  const letterIds = new Set(letters.map((item) => item.id));
  const numberIds = new Set(numbers.map((item) => item.id));

  const practisedLetters = new Set<string>();
  const practisedNumbers = new Set<string>();
  let letterTraces = 0;
  let numberTraces = 0;

  for (const event of events) {
    if (letterIds.has(event.itemId)) {
      practisedLetters.add(event.itemId);
      if (event.kind === "trace") letterTraces++;
    } else if (numberIds.has(event.itemId)) {
      practisedNumbers.add(event.itemId);
      if (event.kind === "trace") numberTraces++;
    }
  }

  const sessions = buildSessions(events);

  return {
    practiceCompletedToday: todaysEvents.length,
    starsToday: todaysEvents.reduce((total, event) => total + event.starsAwarded, 0),
    lettersPracticed: practisedLetters.size,
    numbersPracticed: practisedNumbers.size,
    lettersNeedingPractice: itemsNeedingPractice(letters, progress, 5),
    numbersNeedingPractice: itemsNeedingPractice(numbers, progress, 5),
    letterTraces,
    numberTraces,
    recentSessions: sessions.slice(0, 5),
    totalLearningTimeMs: sessions.reduce(
      (total, session) => total + session.durationMs,
      0,
    ),
  };
}
