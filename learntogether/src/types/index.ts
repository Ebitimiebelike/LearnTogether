/**
 * Core domain types for LearnTogether.
 *
 * These describe the learning content and the learner's state. They are
 * deliberately free of any React or IndexedDB detail so that the same shapes
 * can later be sent to / received from a backend without touching the UI.
 */

/** Categories of learnable content. Adding a category here is the first step to adding a module. */
export type LearningCategory = "letter" | "number";

/** How far along the learner is with one item. Derived, never set by hand. */
export type MasteryStatus = "new" | "introduced" | "practicing" | "mastered";

/** A single thing that can be learned: a letter, a number, and later shapes or words. */
export interface LearningItem {
  /** Stable id, e.g. "letter-a" or "number-3". Used as the progress key. */
  id: string;
  category: LearningCategory;
  /** Canonical value, e.g. "A" or "3". */
  value: string;
  /** What is shown large on screen, e.g. "A" or "3". */
  displayValue: string;
  /** Lowercase form for letters; undefined for numbers. */
  lowercase?: string;
  /** Written-out form, e.g. "Three". Numbers only. */
  writtenWord?: string;
  /** Familiar example word, e.g. "Apple". Letters only. */
  word?: string;
  /** Emoji used as the MVP illustration. Renders offline from system fonts. */
  emoji: string;
  /** Reserved for commissioned artwork, e.g. "/illustrations/apple.svg". Unused in the MVP. */
  image?: string;
  /** Reserved for prerecorded pronunciation, e.g. "/audio/letters/a.mp3". Falls back to speech synthesis. */
  audio?: string;
  /** Phonetic hint spoken by "Listen to the sound", e.g. "A says ah." */
  soundHint?: string;
  /** Ordering / difficulty band. Lower is introduced earlier. */
  level: number;
}

/** The person using the app. One learner per device in the MVP. */
export interface Learner {
  id: string;
  name: string;
  age: number;
  /** Id of an entry in `data/avatars.ts`. */
  avatar: string;
  createdAt: number;
}

/** Per-item progress. One record per (learner, item) pair. */
export interface Progress {
  learnerId: string;
  itemId: string;
  status: MasteryStatus;
  /** Total identification/practice attempts, correct or not. */
  attempts: number;
  /** Attempts that were correct. */
  successes: number;
  /** How many times the learner has traced this character. */
  traceCount: number;
  lastPracticedAt: number;
}

/** A milestone the learner can unlock. Definitions live in `data/badges.ts`. */
export interface Badge {
  id: string;
  label: string;
  description: string;
  emoji: string;
  /** Stars required to unlock. */
  requiredStars: number;
}

/** Stars, badges and streak for one learner. */
export interface RewardState {
  learnerId: string;
  stars: number;
  badges: string[];
  streak: number;
  /** Local date key (YYYY-MM-DD) of the most recent day with activity. */
  lastActiveDate: string | null;
}

export type ThemeSetting = "light" | "dark" | "system";

export interface Settings {
  audioEnabled: boolean;
  soundEffectsEnabled: boolean;
  /** Theme music: a flourish when the app opens, and the hook on a correct answer. */
  musicEnabled: boolean;
  theme: ThemeSetting;
  /** 4-digit caregiver PIN. `null` means the caregiver area is unlocked. */
  caregiverPin: string | null;
  /** False until the learner has finished onboarding + setup + the first lesson. */
  onboardingComplete: boolean;
}

/** What the learner just did. Powers "Recent activity" and the caregiver dashboard. */
export type ActivityKind =
  | "lesson"
  | "trace"
  | "identify"
  | "listen"
  | "match";

export interface ActivityEvent {
  /** Auto-incrementing key assigned by the store. */
  id?: number;
  learnerId: string;
  kind: ActivityKind;
  itemId: string;
  /** Undefined for activities that cannot be got wrong, such as viewing a lesson. */
  correct?: boolean;
  /** Stars awarded by this event. */
  starsAwarded: number;
  /** Milliseconds spent, when the screen can measure it. */
  durationMs?: number;
  timestamp: number;
}

/** A single tap-to-select choice in an identification or listening exercise. */
export interface Choice {
  item: LearningItem;
  isCorrect: boolean;
}

/** One generated question. Produced by pure functions in `features/practice`. */
export interface PracticeQuestion {
  /** The item the learner is being asked to find. */
  target: LearningItem;
  choices: Choice[];
  /** Spoken and displayed prompt, e.g. "Find A." */
  prompt: string;
}
