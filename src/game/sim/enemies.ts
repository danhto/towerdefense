import type { EnemyKind } from "../daily/seed";

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
  swarm: { kind: "swarm", hp: 30, speed: 108, bounty: 4, color: 0x84cc16 },
  tank: { kind: "tank", hp: 165, speed: 46, bounty: 12, color: 0x78716c },
};
