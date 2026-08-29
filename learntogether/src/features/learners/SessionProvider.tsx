"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActivityEvent,
  ActivityKind,
  Badge,
  Learner,
  Progress,
  RewardState,
  Settings,
} from "@/types";
import {
  createLocalRepositories,
  DEFAULT_SETTINGS,
  type Repositories,
} from "@/lib/storage";
import { applyActivity } from "@/features/progress/mastery";
import { awardStars, emptyRewardState, starsFor } from "@/features/rewards/rewards";
import { getAudioService } from "@/lib/audio";

/**
 * The learner's whole state, held in one context.
 *
 * Everything is loaded from the repositories once on mount and kept in memory
 * afterwards, so screens render instantly and never wait on IndexedDB. Writes
 * update state and storage together. React state plus this one context is
 * enough for the MVP: there is no server state to reconcile, so no store
 * library is warranted.
 */

export interface RecordedActivity {
  starsAwarded: number;
  newBadges: Badge[];
}

interface SessionValue {
  /** True until the first load from storage has finished. */
  loading: boolean;
  learner: Learner | null;
  settings: Settings;
  /** Progress by item id, for the current learner. */
  progress: Record<string, Progress>;
  rewards: RewardState;
  /** Newest first. */
  activity: ActivityEvent[];
  createLearner(input: { name: string; age: number; avatar: string }): Promise<Learner>;
  updateLearner(changes: Partial<Omit<Learner, "id" | "createdAt">>): Promise<void>;
  updateSettings(changes: Partial<Settings>): Promise<void>;
  /** Records one completed activity and returns what it earned. */
  recordActivity(input: {
    kind: ActivityKind;
    itemId: string;
    correct?: boolean;
    durationMs?: number;
  }): Promise<RecordedActivity>;
  /** Wipes progress, rewards and history for the current learner. */
  resetProgress(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const NO_REWARDS = emptyRewardState("");

export function SessionProvider({
  children,
  repositories,
}: {
  children: ReactNode;
  /** Injectable so tests can supply in-memory repositories. */
  repositories?: Repositories;
}) {
  // Created once; `createLocalRepositories` opens the database lazily.
  const repositoriesRef = useRef<Repositories | null>(repositories ?? null);
  repositoriesRef.current ??= createLocalRepositories();

  const [loading, setLoading] = useState(true);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [rewards, setRewards] = useState<RewardState>(NO_REWARDS);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    const repos = repositoriesRef.current!;

    (async () => {
      try {
        const [storedSettings, learners] = await Promise.all([
          repos.settings.get(),
          repos.learners.list(),
        ]);
        // One learner per device in the MVP; the newest wins if there are more.
        const current =
          [...learners].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

        let learnerProgress: Progress[] = [];
        let learnerRewards = NO_REWARDS;
        let learnerActivity: ActivityEvent[] = [];

        if (current) {
          const [progressRecords, rewardState, events] = await Promise.all([
            repos.progress.listForLearner(current.id),
            repos.rewards.get(current.id),
            repos.activity.listForLearner(current.id, 100),
          ]);
          learnerProgress = progressRecords;
          learnerRewards = rewardState ?? emptyRewardState(current.id);
          learnerActivity = events;
        }

        if (cancelled) return;
        setSettings(storedSettings);
        setLearner(current);
        setProgress(
          Object.fromEntries(learnerProgress.map((record) => [record.itemId, record])),
        );
        setRewards(learnerRewards);
        setActivity(learnerActivity);
      } catch (error) {
        // A failed read must never leave the app stuck on a spinner.
        console.error("Could not load saved data", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Audio preferences live in settings; push them to the service when they change.
  useEffect(() => {
    getAudioService().setPreferences({
      audioEnabled: settings.audioEnabled,
      soundEffectsEnabled: settings.soundEffectsEnabled,
      musicEnabled: settings.musicEnabled,
    });
  }, [settings.audioEnabled, settings.soundEffectsEnabled, settings.musicEnabled]);

  const createLearner = useCallback(
    async ({ name, age, avatar }: { name: string; age: number; avatar: string }) => {
      const created: Learner = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `learner-${Date.now()}`,
        name: name.trim(),
        age,
        avatar,
        createdAt: Date.now(),
      };
      const fresh = emptyRewardState(created.id);
      await repositoriesRef.current!.learners.save(created);
      await repositoriesRef.current!.rewards.save(fresh);
      setLearner(created);
      setRewards(fresh);
      setProgress({});
      setActivity([]);
      return created;
    },
    [],
  );

  const updateLearner = useCallback(
    async (changes: Partial<Omit<Learner, "id" | "createdAt">>) => {
      setLearner((current) => {
        if (!current) return current;
        const next = { ...current, ...changes };
        void repositoriesRef.current!.learners.save(next);
        return next;
      });
    },
    [],
  );

  const updateSettings = useCallback(async (changes: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      void repositoriesRef.current!.settings.save(next);
      return next;
    });
  }, []);

  const recordActivity = useCallback<SessionValue["recordActivity"]>(
    async ({ kind, itemId, correct, durationMs }) => {
      const repos = repositoriesRef.current!;
      if (!learner) return { starsAwarded: 0, newBadges: [] };

      const now = Date.now();
      const stars = starsFor(kind, correct);

      const updatedProgress = applyActivity(progress[itemId], learner.id, itemId, {
        kind,
        correct,
        at: now,
      });
      setProgress((current) => ({ ...current, [itemId]: updatedProgress }));

      const { state: updatedRewards, newBadges } = awardStars(
        rewards.learnerId === learner.id ? rewards : emptyRewardState(learner.id),
        stars,
        new Date(now),
      );
      setRewards(updatedRewards);

      const event: ActivityEvent = {
        learnerId: learner.id,
        kind,
        itemId,
        correct,
        starsAwarded: stars,
        durationMs,
        timestamp: now,
      };
      // Only the recent slice is kept in memory; storage keeps the rest.
      setActivity((current) => [event, ...current].slice(0, 200));

      await Promise.all([
        repos.progress.save(updatedProgress),
        repos.rewards.save(updatedRewards),
        repos.activity.append(event),
      ]);

      return { starsAwarded: stars, newBadges };
    },
    [learner, progress, rewards],
  );

  const resetProgress = useCallback(async () => {
    if (!learner) return;
    const repos = repositoriesRef.current!;
    const fresh = emptyRewardState(learner.id);
    await Promise.all([
      repos.progress.clearForLearner(learner.id),
      repos.activity.clearForLearner(learner.id),
      repos.rewards.save(fresh),
    ]);
    setProgress({});
    setActivity([]);
    setRewards(fresh);
  }, [learner]);

  const value = useMemo<SessionValue>(
    () => ({
      loading,
      learner,
      settings,
      progress,
      rewards,
      activity,
      createLearner,
      updateLearner,
      updateSettings,
      recordActivity,
      resetProgress,
    }),
    [
      loading,
      learner,
      settings,
      progress,
      rewards,
      activity,
      createLearner,
      updateLearner,
      updateSettings,
      recordActivity,
      resetProgress,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return value;
}

/** Progress records as an array, which is what the summary helpers take. */
export function useProgressList(): Progress[] {
  const { progress } = useSession();
  return useMemo(() => Object.values(progress), [progress]);
}
