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

const KINDS: EnemyKind[] = ["runner", "tank", "swarm"];

/** Pure schedule from seed — no Date / Math.random. */
export function buildSpawnSchedule(
  seed: number,
  waveCount = 10,
): SpawnEvent[] {
  const rng = createRng(seed);
  const events: SpawnEvent[] = [];

  for (let wave = 0; wave < waveCount; wave++) {
    const count = 4 + Math.floor(rng() * 4) + wave;
    let t = 0;
    for (let i = 0; i < count; i++) {
      t += 400 + Math.floor(rng() * 600);
      const kind = KINDS[Math.floor(rng() * KINDS.length)]!;
      events.push({ waveIndex: wave, timeMs: t, kind });
    }
  }

  return events;
}
