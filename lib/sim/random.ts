/** Deterministic PRNG (mulberry32) so every illustrative simulation is reproducible. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    bernoulli: (p: number) => next() < p,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    int: (lo: number, hiInclusive: number) => Math.floor(lo + (hiInclusive - lo + 1) * next()),
  };
}

export type Rng = ReturnType<typeof createRng>;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
