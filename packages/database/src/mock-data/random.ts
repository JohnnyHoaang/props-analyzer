/** Deterministic PRNG (mulberry32) so re-seeding always produces the same
 * mock data — no flaky snapshots, no need to persist a random seed. */
export function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function randInt(rng: () => number, [min, max]: [number, number]): number {
  return min + Math.floor(rng() * (max - min + 1));
}
