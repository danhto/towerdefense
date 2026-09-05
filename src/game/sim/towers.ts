import { PALETTE } from "../theme/palette";

export type TowerKind = "bolt" | "brine" | "burst";

/** MVP: base (1) + one upgrade (2). */
export type TowerTier = 1 | 2;

export const MAX_TOWER_TIER: TowerTier = 2;

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
    cost: 55,
    range: 105,
    damage: 16,
    fireIntervalMs: 480,
    slowFactor: 1,
    splashRadius: 0,
    color: PALETTE.amber,
  },
  brine: {
    kind: "brine",
    name: "Mint Brine",
    cost: 70,
    range: 95,
    damage: 7,
    fireIntervalMs: 580,
    slowFactor: 0.5,
    splashRadius: 0,
    color: PALETTE.brine,
  },
  burst: {
    kind: "burst",
    name: "Coral Burst",
    cost: 90,
    range: 85,
    damage: 12,
    fireIntervalMs: 720,
    slowFactor: 1,
    splashRadius: 44,
    color: PALETTE.coral,
  },
};

export const SELL_REFUND_RATIO = 0.55;

export function sellRefund(cost: number): number {
  return Math.floor(cost * SELL_REFUND_RATIO);
}

/** Gold to go from `fromTier` → next tier, or null if already maxed. */
export function upgradeCost(
  kind: TowerKind,
  fromTier: TowerTier,
): number | null {
  if (fromTier >= MAX_TOWER_TIER) return null;
  return Math.floor(TOWER_DEFS[kind].cost * 0.85);
}

/** Total gold invested in a tower at the given tier (place + upgrades). */
export function investedCost(kind: TowerKind, tier: TowerTier): number {
  let total = TOWER_DEFS[kind].cost;
  if (tier >= 2) {
    total += upgradeCost(kind, 1) ?? 0;
  }
  return total;
}

export function sellRefundForTower(kind: TowerKind, tier: TowerTier): number {
  return sellRefund(investedCost(kind, tier));
}

/** Combat stats for a tower at a given tier. */
export function towerStats(kind: TowerKind, tier: TowerTier): TowerDef {
  const base = TOWER_DEFS[kind];
  if (tier === 1) return { ...base };

  return {
    ...base,
    name: `${base.name} II`,
    damage: Math.round(base.damage * 1.4),
    range: Math.round(base.range * 1.12),
    fireIntervalMs: Math.max(300, Math.round(base.fireIntervalMs * 0.88)),
    splashRadius:
      base.splashRadius > 0 ? Math.round(base.splashRadius * 1.15) : 0,
    slowFactor:
      base.slowFactor < 1 ? Math.max(0.35, base.slowFactor - 0.08) : 1,
  };
}
