import { PALETTE } from "../theme/palette";

export type TowerKind = "bolt" | "brine" | "burst";

export interface TowerDef {
  kind: TowerKind;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireIntervalMs: number;
  slowFactor: number; // 1 = none; 0.5 = half speed
  splashRadius: number;
  color: number;
}

export const TOWER_DEFS: Record<TowerKind, TowerDef> = {
  bolt: {
    kind: "bolt",
    name: "Amber Bolt",
    cost: 50,
    range: 110,
    damage: 18,
    fireIntervalMs: 450,
    slowFactor: 1,
    splashRadius: 0,
    color: PALETTE.amber,
  },
  brine: {
    kind: "brine",
    name: "Teal Brine",
    cost: 65,
    range: 100,
    damage: 8,
    fireIntervalMs: 550,
    slowFactor: 0.55,
    splashRadius: 0,
    color: PALETTE.seaTeal,
  },
  burst: {
    kind: "burst",
    name: "Coral Burst",
    cost: 80,
    range: 90,
    damage: 14,
    fireIntervalMs: 700,
    slowFactor: 1,
    splashRadius: 48,
    color: PALETTE.coral,
  },
};

export const SELL_REFUND_RATIO = 0.6;

export function sellRefund(cost: number): number {
  return Math.floor(cost * SELL_REFUND_RATIO);
}
