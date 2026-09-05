import { describe, expect, it } from "vitest";
import { canAfford, createEconomy, earn, spend } from "../../src/game/systems/economy";
import { applyLeak, createLives } from "../../src/game/systems/lives";

describe("economy (G1)", () => {
  it("rejects overspend and never goes negative on legal spend", () => {
    let eco = createEconomy(100);
    expect(canAfford(eco, 40)).toBe(true);
    eco = spend(eco, 40);
    expect(eco.gold).toBe(60);
    expect(canAfford(eco, 61)).toBe(false);
    expect(() => spend(eco, 61)).toThrow(/insufficient/);
    eco = earn(eco, 10);
    expect(eco.gold).toBe(70);
  });
});

describe("lives / leak (G1)", () => {
  it("decrements lives and fails at zero", () => {
    let lives = createLives(3);
    let result = applyLeak(lives);
    expect(result.outcome).toBe("continue");
    expect(result.livesLeft).toBe(2);
    lives = result.state;

    result = applyLeak(lives, 2);
    expect(result.outcome).toBe("fail");
    expect(result.livesLeft).toBe(0);
  });
});
