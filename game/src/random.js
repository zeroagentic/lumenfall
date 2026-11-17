// random.js — a tiny seeded generator (mulberry32) so a run replays exactly from its seed;
// the screenshot scenes and the level layouts both draw from it and nothing reads Math.random.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random in [low, high). */
export function between(random, low, high) {
  return low + random() * (high - low);
}
