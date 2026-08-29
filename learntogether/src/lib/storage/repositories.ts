/**
 * Repositories: the only place that knows how domain objects are stored.
 *
 * Each repository is an interface plus a local (device-only) implementation.
 * A future `ApiLearnerRepository` can implement the same interface and be
 * injected without any UI change.
 */
import type {
  ActivityEvent,
  Learner,
  Progress,
  RewardState,
  Settings,
} from "@/types";
import { getDriver, type StoreDriver } from "./driver";

export const DEFAULT_SETTINGS: Settings = {
  audioEnabled: true,
  soundEffectsEnabled: true,
  musicEnabled: true,
  theme: "system",
  caregiverPin: null,
  onboardingComplete: false,
};

const SETTINGS_KEY = "settings";

export interface LearnerRepository {
  list(): Promise<Learner[]>;
  get(id: string): Promise<Learner | undefined>;
  save(learner: Learner): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ProgressRepository {
  listForLearner(learnerId: string): Promise<Progress[]>;
  get(learnerId: string, itemId: string): Promise<Progress | undefined>;
  save(progress: Progress): Promise<void>;
  clearForLearner(learnerId: string): Promise<void>;
}

export interface RewardRepository {
  get(learnerId: string): Promise<RewardState | undefined>;
  save(state: RewardState): Promise<void>;
  clearForLearner(learnerId: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

export interface ActivityRepository {
  listForLearner(learnerId: string, limit?: number): Promise<ActivityEvent[]>;
  append(event: ActivityEvent): Promise<void>;
  clearForLearner(learnerId: string): Promise<void>;
}

export class LocalLearnerRepository implements LearnerRepository {
  constructor(private driver: StoreDriver = getDriver()) {}
  list() {
    return this.driver.getAll<Learner>("learners");
  }
  get(id: string) {
    return this.driver.get<Learner>("learners", id);
  }
  save(learner: Learner) {
    return this.driver.put("learners", learner);
  }
  remove(id: string) {
    return this.driver.delete("learners", id);
  }
}

export class LocalProgressRepository implements ProgressRepository {
  constructor(private driver: StoreDriver = getDriver()) {}
  listForLearner(learnerId: string) {
    return this.driver.getAllByIndex<Progress>("progress", "byLearner", learnerId);
  }
  get(learnerId: string, itemId: string) {
    return this.driver.get<Progress>("progress", [learnerId, itemId]);
  }
  save(progress: Progress) {
    return this.driver.put("progress", progress);
  }
  async clearForLearner(learnerId: string) {
    const records = await this.listForLearner(learnerId);
    await Promise.all(
      records.map((record) =>
        this.driver.delete("progress", [record.learnerId, record.itemId]),
      ),
    );
  }
}

export class LocalRewardRepository implements RewardRepository {
  constructor(private driver: StoreDriver = getDriver()) {}
  get(learnerId: string) {
    return this.driver.get<RewardState>("rewards", learnerId);
  }
  save(state: RewardState) {
    return this.driver.put("rewards", state);
  }
  clearForLearner(learnerId: string) {
    return this.driver.delete("rewards", learnerId);
  }
}

export class LocalSettingsRepository implements SettingsRepository {
  constructor(private driver: StoreDriver = getDriver()) {}
  async get() {
    const stored = await this.driver.get<Settings>("settings", SETTINGS_KEY);
    // Merge so that settings added in a later release get sane defaults.
    return { ...DEFAULT_SETTINGS, ...stored };
  }
  save(settings: Settings) {
    return this.driver.put("settings", settings, SETTINGS_KEY);
  }
}

export class LocalActivityRepository implements ActivityRepository {
  constructor(private driver: StoreDriver = getDriver()) {}
  async listForLearner(learnerId: string, limit?: number) {
    const events = await this.driver.getAllByIndex<ActivityEvent>(
      "activity",
      "byLearner",
      learnerId,
    );
    events.sort((a, b) => b.timestamp - a.timestamp);
    return limit === undefined ? events : events.slice(0, limit);
  }
  async append(event: ActivityEvent) {
    await this.driver.add("activity", event);
  }
  async clearForLearner(learnerId: string) {
    const events = await this.listForLearner(learnerId);
    await Promise.all(
      events
        .filter((event) => event.id !== undefined)
        .map((event) => this.driver.delete("activity", event.id!)),
    );
  }
}

/** Everything the app needs to persist, bundled so it can be swapped in one go. */
export interface Repositories {
  learners: LearnerRepository;
  progress: ProgressRepository;
  rewards: RewardRepository;
  settings: SettingsRepository;
  activity: ActivityRepository;
}

export function createLocalRepositories(
  driver: StoreDriver = getDriver(),
): Repositories {
  return {
    learners: new LocalLearnerRepository(driver),
    progress: new LocalProgressRepository(driver),
    rewards: new LocalRewardRepository(driver),
    settings: new LocalSettingsRepository(driver),
    activity: new LocalActivityRepository(driver),
  };
}
