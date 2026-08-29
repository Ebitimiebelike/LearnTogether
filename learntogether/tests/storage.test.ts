import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  createLocalRepositories,
  DEFAULT_SETTINGS,
  IndexedDbDriver,
  MemoryDriver,
  setDriver,
  type Repositories,
  type StoreDriver,
} from "@/lib/storage";
import { emptyProgress } from "@/features/progress/mastery";
import { emptyRewardState } from "@/features/rewards/rewards";
import type { ActivityEvent, Learner } from "@/types";

const LEARNER: Learner = {
  id: "learner-1",
  name: "Sam",
  age: 15,
  avatar: "fox",
  createdAt: 1000,
};

function event(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    learnerId: LEARNER.id,
    kind: "identify",
    itemId: "letter-a",
    correct: true,
    starsAwarded: 1,
    timestamp: 1000,
    ...overrides,
  };
}

/**
 * Both drivers must behave identically: the memory driver is the fallback when
 * a browser blocks IndexedDB, so a difference between them would be a bug that
 * only shows up in private browsing.
 */
const DRIVERS: [string, () => StoreDriver][] = [
  [
    "IndexedDbDriver",
    () => {
      // A fresh database per test, so state never leaks between them.
      globalThis.indexedDB = new IDBFactory();
      return new IndexedDbDriver();
    },
  ],
  ["MemoryDriver", () => new MemoryDriver()],
];

describe.each(DRIVERS)("%s", (_name, makeDriver) => {
  let repositories: Repositories;

  beforeEach(() => {
    repositories = createLocalRepositories(makeDriver());
  });

  describe("learners", () => {
    it("saves and reads back a learner", async () => {
      await repositories.learners.save(LEARNER);
      expect(await repositories.learners.get(LEARNER.id)).toEqual(LEARNER);
    });

    it("returns undefined for an unknown learner", async () => {
      expect(await repositories.learners.get("nobody")).toBeUndefined();
    });

    it("lists every learner", async () => {
      await repositories.learners.save(LEARNER);
      await repositories.learners.save({ ...LEARNER, id: "learner-2", name: "Alex" });
      expect(await repositories.learners.list()).toHaveLength(2);
    });

    it("replaces rather than duplicates on a second save", async () => {
      await repositories.learners.save(LEARNER);
      await repositories.learners.save({ ...LEARNER, name: "Samuel" });
      const all = await repositories.learners.list();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("Samuel");
    });

    it("removes a learner", async () => {
      await repositories.learners.save(LEARNER);
      await repositories.learners.remove(LEARNER.id);
      expect(await repositories.learners.list()).toEqual([]);
    });
  });

  describe("progress", () => {
    it("keys records by learner and item together", async () => {
      const mine = emptyProgress(LEARNER.id, "letter-a");
      const theirs = emptyProgress("learner-2", "letter-a");
      await repositories.progress.save(mine);
      await repositories.progress.save(theirs);

      expect(await repositories.progress.listForLearner(LEARNER.id)).toEqual([mine]);
      expect(await repositories.progress.get(LEARNER.id, "letter-a")).toEqual(mine);
    });

    it("updates an existing record in place", async () => {
      await repositories.progress.save(emptyProgress(LEARNER.id, "letter-a"));
      await repositories.progress.save({
        ...emptyProgress(LEARNER.id, "letter-a"),
        attempts: 3,
      });
      const records = await repositories.progress.listForLearner(LEARNER.id);
      expect(records).toHaveLength(1);
      expect(records[0].attempts).toBe(3);
    });

    it("clears one learner without touching another", async () => {
      await repositories.progress.save(emptyProgress(LEARNER.id, "letter-a"));
      await repositories.progress.save(emptyProgress("learner-2", "letter-a"));
      await repositories.progress.clearForLearner(LEARNER.id);

      expect(await repositories.progress.listForLearner(LEARNER.id)).toEqual([]);
      expect(await repositories.progress.listForLearner("learner-2")).toHaveLength(1);
    });
  });

  describe("rewards", () => {
    it("stores one record per learner", async () => {
      const state = { ...emptyRewardState(LEARNER.id), stars: 12 };
      await repositories.rewards.save(state);
      expect(await repositories.rewards.get(LEARNER.id)).toEqual(state);
    });

    it("returns undefined before anything is saved", async () => {
      expect(await repositories.rewards.get(LEARNER.id)).toBeUndefined();
    });
  });

  describe("settings", () => {
    it("returns the defaults when nothing is stored", async () => {
      expect(await repositories.settings.get()).toEqual(DEFAULT_SETTINGS);
    });

    it("round-trips saved settings", async () => {
      await repositories.settings.save({
        ...DEFAULT_SETTINGS,
        audioEnabled: false,
        caregiverPin: "1234",
      });
      const stored = await repositories.settings.get();
      expect(stored.audioEnabled).toBe(false);
      expect(stored.caregiverPin).toBe("1234");
    });

    it("fills in defaults for settings added in a later release", async () => {
      // Simulates a record written before `theme` existed.
      await repositories.settings.save({
        audioEnabled: false,
      } as never);
      const stored = await repositories.settings.get();
      expect(stored.audioEnabled).toBe(false);
      expect(stored.theme).toBe(DEFAULT_SETTINGS.theme);
      expect(stored.onboardingComplete).toBe(false);
    });
  });

  describe("activity", () => {
    it("returns events newest first", async () => {
      await repositories.activity.append(event({ timestamp: 100 }));
      await repositories.activity.append(event({ timestamp: 300 }));
      await repositories.activity.append(event({ timestamp: 200 }));

      const events = await repositories.activity.listForLearner(LEARNER.id);
      expect(events.map((entry) => entry.timestamp)).toEqual([300, 200, 100]);
    });

    it("applies the limit to the newest events", async () => {
      for (const timestamp of [1, 2, 3, 4, 5]) {
        await repositories.activity.append(event({ timestamp }));
      }
      const events = await repositories.activity.listForLearner(LEARNER.id, 2);
      expect(events.map((entry) => entry.timestamp)).toEqual([5, 4]);
    });

    it("keeps learners separate", async () => {
      await repositories.activity.append(event());
      await repositories.activity.append(event({ learnerId: "learner-2" }));
      expect(await repositories.activity.listForLearner(LEARNER.id)).toHaveLength(1);
    });

    it("clears one learner's history only", async () => {
      await repositories.activity.append(event());
      await repositories.activity.append(event({ learnerId: "learner-2" }));
      await repositories.activity.clearForLearner(LEARNER.id);

      expect(await repositories.activity.listForLearner(LEARNER.id)).toEqual([]);
      expect(await repositories.activity.listForLearner("learner-2")).toHaveLength(1);
    });
  });
});

describe("driver selection", () => {
  it("can be replaced for tests and reset to auto-detection", async () => {
    const memory = new MemoryDriver();
    setDriver(memory);
    await createLocalRepositories(memory).learners.save(LEARNER);
    expect(await memory.get("learners", LEARNER.id)).toEqual(LEARNER);
    setDriver(null);
  });
});

describe("data survives a reopened database", () => {
  it("reads back what a previous session wrote", async () => {
    globalThis.indexedDB = new IDBFactory();
    await createLocalRepositories(new IndexedDbDriver()).learners.save(LEARNER);

    // A new driver against the same underlying database, as after a reload.
    const reopened = createLocalRepositories(new IndexedDbDriver());
    expect(await reopened.learners.get(LEARNER.id)).toEqual(LEARNER);
  });
});
