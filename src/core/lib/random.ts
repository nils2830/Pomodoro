/** Small seeded PRNG (mulberry32) so sample data is reproducible. */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    chance: (p: number) => next() < p,
    /** Roughly normal (sum of uniforms), good enough for jitter. */
    normal: (mean: number, sd: number) => {
      const u = (next() + next() + next() + next() - 2) / 0.577;
      return mean + u * sd;
    },
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  };
}
