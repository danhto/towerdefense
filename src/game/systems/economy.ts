/**
 * Economy helpers for G1 — gold never goes negative on legal spends.
 */

export interface EconomyState {
  gold: number;
}

export function createEconomy(startingGold: number): EconomyState {
  if (startingGold < 0) throw new Error("startingGold must be >= 0");
  return { gold: startingGold };
}

export function canAfford(state: EconomyState, cost: number): boolean {
  return cost >= 0 && state.gold >= cost;
}

export function spend(state: EconomyState, cost: number): EconomyState {
  if (cost < 0) throw new Error("cost must be >= 0");
  if (!canAfford(state, cost)) throw new Error("insufficient gold");
  return { gold: state.gold - cost };
}

export function earn(state: EconomyState, amount: number): EconomyState {
  if (amount < 0) throw new Error("amount must be >= 0");
  return { gold: state.gold + amount };
}
