import type { EnemyKind } from "../daily/seed";
import type { TowerKind } from "./towers";

export interface EnemyStats {
  kind: EnemyKind;
  hp: number;
  speed: number; // px / second along path
  bounty: number;
  color: number;
}

/** Tuned for a tighter daily — higher HP/speed, leaner bounties. */
export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  runner: { kind: "runner", hp: 58, speed: 78, bounty: 6, color: 0xf59e0b },
  swarm: { kind: "swarm", hp: 32, speed: 108, bounty: 4, color: 0x84cc16 },
  tank: { kind: "tank", hp: 175, speed: 46, bounty: 12, color: 0x78716c },
};

/**
 * Damage taken multipliers — bolt-only clears early runners, but late
 * swarms/tanks punish mono-loadouts and push mixed placement.
 *
 *   runner — soft targets; bolt still shines
 *   swarm  — shrugs off single shots; burst shreds the pack
 *   tank   — armored vs bolt/burst; brine corrodes the plating
 */
export const DAMAGE_TAKEN: Record<EnemyKind, Record<TowerKind, number>> = {
  runner: { bolt: 1.15, brine: 1.0, burst: 0.85 },
  swarm: { bolt: 0.32, brine: 0.7, burst: 1.45 },
  tank: { bolt: 0.48, brine: 1.4, burst: 0.5 },
};

/** Brine paints a corrode mark that amps follow-up bolt/burst hits. */
export const BRINE_CORRODE_MS = 1500;
export const BRINE_CORRODE_MULT = 1.5;

export function damageTakenMultiplier(
  enemy: EnemyKind,
  tower: TowerKind,
): number {
  return DAMAGE_TAKEN[enemy][tower];
}

export function roleHintLine(): string {
  return "Bolt shreds runners · Burst clears swarms · Brine softens tanks";
}
