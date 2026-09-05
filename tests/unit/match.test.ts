import { describe, expect, it } from "vitest";
import { MatchSim } from "../../src/game/sim/match";
import { isBuildable } from "../../src/game/sim/map";

function makeSim(
  overrides: Partial<ConstructorParameters<typeof MatchSim>[0]> = {},
): MatchSim {
  return new MatchSim({
    seed: 42,
    dateKey: "2026-03-05",
    mode: "official",
    attemptNumber: 1,
    waveCount: 2,
    startingGold: 500,
    startingLives: 3,
    ...overrides,
  });
}

describe("match sim (G1)", () => {
  it("places towers only on buildable tiles and spends gold", () => {
    const sim = makeSim();
    const before = sim.snapshot().gold;
    expect(sim.tryPlaceAt(0, 0)).toBe(true);
    expect(isBuildable(0, 0)).toBe(true);
    expect(sim.snapshot().gold).toBeLessThan(before);
    expect(sim.tryPlaceAt(1, 0)).toBe(false);
    expect(sim.snapshot().towers).toHaveLength(1);
  });

  it("sells towers for a partial refund", () => {
    const sim = makeSim();
    sim.tryPlaceAt(0, 0);
    const afterPlace = sim.snapshot().gold;
    expect(sim.trySellAt(0, 0)).toBe(true);
    expect(sim.snapshot().gold).toBeGreaterThan(afterPlace);
    expect(sim.snapshot().towers).toHaveLength(0);
  });

  it("clears a short seeded run when well defended", () => {
    const sim = makeSim({ startingGold: 2000, waveCount: 1 });
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        sim.selectTowerKind(col % 2 === 0 ? "bolt" : "burst");
        sim.tryPlaceAt(col, row);
      }
    }
    expect(sim.startWave()).toBe(true);
    for (let i = 0; i < 20_000; i++) {
      const snap = sim.tick(100);
      if (snap.phase === "won" || snap.phase === "lost") {
        expect(snap.phase).toBe("won");
        expect(snap.score).toBeGreaterThan(0);
        return;
      }
    }
    throw new Error("match did not finish");
  });

  it("fails when enemies leak with no towers", () => {
    const sim = makeSim({ startingLives: 1, waveCount: 1, startingGold: 0 });
    expect(sim.startWave()).toBe(true);
    for (let i = 0; i < 20_000; i++) {
      const snap = sim.tick(200);
      if (snap.phase === "won" || snap.phase === "lost") {
        expect(snap.phase).toBe("lost");
        expect(snap.failReason).toMatch(/harbor gate/i);
        return;
      }
    }
    throw new Error("match did not finish");
  });

  it("never lets gold go negative from illegal placement attempts", () => {
    const sim = makeSim({ startingGold: 40 });
    sim.selectTowerKind("burst");
    expect(sim.tryPlaceAt(0, 0)).toBe(false);
    expect(sim.snapshot().gold).toBe(40);
  });

  it("marks near-miss when an enemy enters the last 10% of the path", () => {
    const sim = makeSim({ startingLives: 3, waveCount: 1, startingGold: 0 });
    expect(sim.startWave()).toBe(true);
    let sawNear = false;
    for (let i = 0; i < 20_000; i++) {
      const snap = sim.tick(50);
      const events = sim.drainEvents();
      if (events.some((e) => e.type === "near_miss")) sawNear = true;
      if (snap.nearMissActive) {
        expect(snap.enemies.some((e) => e.nearMiss)).toBe(true);
        expect(sawNear).toBe(true);
        return;
      }
      if (snap.phase === "lost" || snap.phase === "won") break;
    }
    throw new Error("never entered near-miss zone");
  });

  it("emits tower_placed and wave_started events", () => {
    const sim = makeSim();
    sim.tryPlaceAt(0, 0);
    const placed = sim.drainEvents().filter((e) => e.type === "tower_placed");
    expect(placed).toHaveLength(1);
    sim.startWave();
    const waves = sim.drainEvents().filter((e) => e.type === "wave_started");
    expect(waves).toHaveLength(1);
  });
});
