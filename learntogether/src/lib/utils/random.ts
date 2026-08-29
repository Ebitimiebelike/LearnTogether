/**
 * Randomness is injected everywhere it is used so practice generation stays
 * deterministic under test.
 */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** Fisher–Yates. Returns a new array; never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: Rng = defaultRng): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(rng() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function pickOne<T>(items: readonly T[], rng: Rng = defaultRng): T {
  return items[Math.floor(rng() * items.length)];
}

/** `count` distinct items, or all of them when the pool is smaller. */
export function sample<T>(items: readonly T[], count: number, rng: Rng = defaultRng): T[] {
  return shuffle(items, rng).slice(0, Math.min(count, items.length));
}
