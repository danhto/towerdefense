/**
 * Deterministic daily seed (metric T5 / gate G2).
 * Same UTC calendar day → same numeric seed and spawn schedule.
 */

export function utcDateString(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** FNV-1a 32-bit → unsigned int for mulberry32. */
export function hashStringToSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function dailySeed(date: Date = new Date()): {
  dateKey: string;
  seed: number;
} {
  const dateKey = utcDateString(date);
  return { dateKey, seed: hashStringToSeed(`daily-hold:${dateKey}`) };
}

/** Mulberry32 — identical seed ⇒ identical sequence. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type EnemyKind = "runner" | "tank" | "swarm";

export interface SpawnEvent {
  waveIndex: number;
  timeMs: number;
  kind: EnemyKind;
}

/**
 * Wave-weighted pick — early days favor runners (bolt works), later waves
 * lean into swarms/tanks that resist Amber Bolt and demand mixed loadouts.
 */
export function pickEnemyKind(
  rng: () => number,
  waveIndex: number,
  waveCount: number,
): EnemyKind {
  const progress = waveIndex / Math.max(1, waveCount - 1);
  const roll = rng();
  if (progress < 0.28) {
    if (roll < 0.68) return "runner";
    if (roll < 0.88) return "swarm";
    return "tank";
  }
  if (progress < 0.62) {
    if (roll < 0.34) return "runner";
    if (roll < 0.66) return "swarm";
    return "tank";
  }
  if (roll < 0.16) return "runner";
  if (roll < 0.52) return "swarm";
  return "tank";
}

/** Pure schedule from seed — no Date / Math.random. */
export function buildSpawnSchedule(
  seed: number,
  waveCount = 10,
): SpawnEvent[] {
  const rng = createRng(seed);
  const events: SpawnEvent[] = [];

  for (let wave = 0; wave < waveCount; wave++) {
    // Slightly denser packs than the first MVP pass — rewards planning.
    const count = 5 + Math.floor(rng() * 4) + wave;
    let t = 0;
    for (let i = 0; i < count; i++) {
      t += 280 + Math.floor(rng() * 420);
      const kind = pickEnemyKind(rng, wave, waveCount);
      events.push({ waveIndex: wave, timeMs: t, kind });
    }
  }

  return events;
}
