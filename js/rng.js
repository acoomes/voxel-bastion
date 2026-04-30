// rng.js - Seeded pseudo-random number generation for deterministic runs.
// Use only for gameplay-affecting randomness (wave composition, enemy splits,
// freeze procs). Visual/audio randomness stays on Math.random.

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return (Math.random() * 0x100000000) >>> 0;
}

export function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(lo, hi, rng) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function chance(p, rng) {
  return rng() < p;
}
