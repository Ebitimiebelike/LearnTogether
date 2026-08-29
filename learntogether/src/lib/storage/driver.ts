/**
 * Low-level persistence driver.
 *
 * Everything above this file talks to `StoreDriver`, never to IndexedDB
 * directly. That keeps the repositories (and therefore the whole UI) testable
 * in Node and makes it possible to add a remote-syncing driver later without
 * touching a single component.
 */

export const DB_NAME = "learntogether";
export const DB_VERSION = 1;

export type StoreName =
  | "learners"
  | "progress"
  | "rewards"
  | "settings"
  | "activity";

export interface StoreDriver {
  get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined>;
  getAll<T>(store: StoreName): Promise<T[]>;
  getAllByIndex<T>(
    store: StoreName,
    index: string,
    value: IDBValidKey,
  ): Promise<T[]>;
  /** Insert or replace, using the store's own key path. */
  put<T>(store: StoreName, value: T, key?: IDBValidKey): Promise<void>;
  /** Insert with an auto-generated key. Returns the new key. */
  add<T>(store: StoreName, value: T): Promise<IDBValidKey>;
  delete(store: StoreName, key: IDBValidKey): Promise<void>;
  clear(store: StoreName): Promise<void>;
}

/** Describes each object store so both drivers stay in sync. */
interface StoreSchema {
  keyPath: string | string[] | null;
  autoIncrement?: boolean;
  indexes?: { name: string; keyPath: string }[];
}

export const SCHEMA: Record<StoreName, StoreSchema> = {
  learners: { keyPath: "id" },
  progress: {
    keyPath: ["learnerId", "itemId"],
    indexes: [{ name: "byLearner", keyPath: "learnerId" }],
  },
  rewards: { keyPath: "learnerId" },
  // Settings is a singleton record stored under an explicit key.
  settings: { keyPath: null },
  activity: {
    keyPath: "id",
    autoIncrement: true,
    indexes: [{ name: "byLearner", keyPath: "learnerId" }],
  },
};

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbDriver implements StoreDriver {
  #db: Promise<IDBDatabase> | null = null;

  #open(): Promise<IDBDatabase> {
    this.#db ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const [name, schema] of Object.entries(SCHEMA) as [
          StoreName,
          StoreSchema,
        ][]) {
          if (db.objectStoreNames.contains(name)) continue;
          const store = db.createObjectStore(name, {
            keyPath: schema.keyPath ?? undefined,
            autoIncrement: schema.autoIncrement ?? false,
          });
          for (const index of schema.indexes ?? []) {
            store.createIndex(index.name, index.keyPath);
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.#db;
  }

  async #tx(store: StoreName, mode: IDBTransactionMode) {
    const db = await this.#open();
    return db.transaction(store, mode).objectStore(store);
  }

  async get<T>(store: StoreName, key: IDBValidKey) {
    return promisify<T | undefined>(
      (await this.#tx(store, "readonly")).get(key) as IDBRequest<T | undefined>,
    );
  }

  async getAll<T>(store: StoreName) {
    return promisify<T[]>(
      (await this.#tx(store, "readonly")).getAll() as IDBRequest<T[]>,
    );
  }

  async getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey) {
    const objectStore = await this.#tx(store, "readonly");
    return promisify<T[]>(
      objectStore.index(index).getAll(value) as IDBRequest<T[]>,
    );
  }

  async put<T>(store: StoreName, value: T, key?: IDBValidKey) {
    await promisify((await this.#tx(store, "readwrite")).put(value, key));
  }

  async add<T>(store: StoreName, value: T) {
    return promisify((await this.#tx(store, "readwrite")).add(value));
  }

  async delete(store: StoreName, key: IDBValidKey) {
    await promisify((await this.#tx(store, "readwrite")).delete(key));
  }

  async clear(store: StoreName) {
    await promisify((await this.#tx(store, "readwrite")).clear());
  }
}

/**
 * Fallback used when IndexedDB is unavailable — private browsing modes and
 * some locked-down tablet browsers block it. The app stays fully usable for the
 * session; only persistence across reloads is lost.
 */
export class MemoryDriver implements StoreDriver {
  #data = new Map<StoreName, Map<string, unknown>>();
  #autoKey = new Map<StoreName, number>();

  #store(name: StoreName) {
    let store = this.#data.get(name);
    if (!store) {
      store = new Map();
      this.#data.set(name, store);
    }
    return store;
  }

  /** IndexedDB compares array keys structurally; Map does not, so serialise. */
  #serialise(key: IDBValidKey) {
    return JSON.stringify(key);
  }

  #keyOf(name: StoreName, value: unknown, explicit?: IDBValidKey) {
    if (explicit !== undefined) return this.#serialise(explicit);
    const { keyPath } = SCHEMA[name];
    const record = value as Record<string, IDBValidKey>;
    if (Array.isArray(keyPath)) {
      return this.#serialise(keyPath.map((path) => record[path]));
    }
    return this.#serialise(record[keyPath as string]);
  }

  async get<T>(store: StoreName, key: IDBValidKey) {
    return this.#store(store).get(this.#serialise(key)) as T | undefined;
  }

  async getAll<T>(store: StoreName) {
    return [...this.#store(store).values()] as T[];
  }

  async getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey) {
    const keyPath = SCHEMA[store].indexes?.find((i) => i.name === index)?.keyPath;
    if (!keyPath) return [];
    return [...this.#store(store).values()].filter(
      (record) => (record as Record<string, unknown>)[keyPath] === value,
    ) as T[];
  }

  async put<T>(store: StoreName, value: T, key?: IDBValidKey) {
    this.#store(store).set(this.#keyOf(store, value, key), value);
  }

  async add<T>(store: StoreName, value: T) {
    const next = (this.#autoKey.get(store) ?? 0) + 1;
    this.#autoKey.set(store, next);
    const record = { ...(value as object), id: next };
    this.#store(store).set(this.#serialise(next), record);
    return next;
  }

  async delete(store: StoreName, key: IDBValidKey) {
    this.#store(store).delete(this.#serialise(key));
  }

  async clear(store: StoreName) {
    this.#store(store).clear();
  }
}

let driver: StoreDriver | null = null;

/** Returns the process-wide driver, choosing IndexedDB when the browser allows it. */
export function getDriver(): StoreDriver {
  driver ??=
    typeof indexedDB !== "undefined" ? new IndexedDbDriver() : new MemoryDriver();
  return driver;
}

/** Test seam: swap in a driver, or pass `null` to fall back to auto-detection. */
export function setDriver(next: StoreDriver | null) {
  driver = next;
}
