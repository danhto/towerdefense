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

/** Gold to go from `fromTier` → next tier, or null if already maxed. */
export function upgradeCost(
  kind: TowerKind,
  fromTier: TowerTier,
): number | null {
  if (fromTier >= MAX_TOWER_TIER) return null;
  return Math.floor(TOWER_DEFS[kind].cost * 0.8);
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
    damage: Math.round(base.damage * 1.45),
    range: Math.round(base.range * 1.15),
    fireIntervalMs: Math.max(280, Math.round(base.fireIntervalMs * 0.85)),
    splashRadius:
      base.splashRadius > 0 ? Math.round(base.splashRadius * 1.2) : 0,
    slowFactor:
      base.slowFactor < 1 ? Math.max(0.35, base.slowFactor - 0.1) : 1,
  };
}
