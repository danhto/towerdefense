import type { EnemyKind } from "../daily/seed";

export interface EnemyStats {
  kind: EnemyKind;
  hp: number;
  speed: number; // px / second along path
  bounty: number;
  color: number;
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  runner: { kind: "runner", hp: 40, speed: 70, bounty: 8, color: 0xf59e0b },
  swarm: { kind: "swarm", hp: 22, speed: 95, bounty: 5, color: 0x84cc16 },
  tank: { kind: "tank", hp: 120, speed: 42, bounty: 16, color: 0x78716c },
};
