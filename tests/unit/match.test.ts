import { describe, expect, it } from "vitest";
import { MatchSim } from "../../src/game/sim/match";

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


function firstBuildable(sim: MatchSim): { col: number; row: number } {
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 12; col++) {
      if (sim.map.isBuildable(col, row)) return { col, row };
    }
  }
  throw new Error("no buildable tile");
}

function firstPath(sim: MatchSim): { col: number; row: number } {
  return { col: sim.map.spawnTile.x, row: sim.map.spawnTile.y };
}

function placeDefault(sim: MatchSim, col: number, row: number): boolean {
  sim.selectTowerKind("bolt");
  return sim.tryPlaceAt(col, row);
}

describe("match sim (G1)", () => {
  it("places towers only on buildable tiles and spends gold", () => {
    const sim = makeSim();
    const before = sim.snapshot().gold;
    const grass = firstBuildable(sim);
    const path = firstPath(sim);
    expect(placeDefault(sim, grass.col, grass.row)).toBe(true);
    expect(sim.map.isBuildable(grass.col, grass.row)).toBe(true);
    expect(sim.snapshot().gold).toBeLessThan(before);
    expect(sim.tryPlaceAt(path.col, path.row)).toBe(false);
    expect(sim.snapshot().towers).toHaveLength(1);
  });

  it("sells towers for a partial refund", () => {
    const sim = makeSim();
    const g = firstBuildable(sim);
    placeDefault(sim, g.col, g.row);
    const afterPlace = sim.snapshot().gold;
    expect(sim.trySellAt(g.col, g.row)).toBe(true);
    expect(sim.snapshot().gold).toBeGreaterThan(afterPlace);
    expect(sim.snapshot().towers).toHaveLength(0);
  });

  it("refuses placement until a tower kind is selected", () => {
    const sim = makeSim();
    const g = firstBuildable(sim);
    expect(sim.snapshot().selectedTowerKind).toBeNull();
    expect(sim.tryPlaceAt(g.col, g.row)).toBe(false);
    expect(sim.snapshot().towers).toHaveLength(0);
    sim.selectTowerKind("bolt");
    expect(sim.tryPlaceAt(g.col, g.row)).toBe(true);
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
        expect(snap.leaks).toBeGreaterThanOrEqual(1);
        expect(snap.closestLeakPct).toBe(0);
        return;
      }
    }
    throw new Error("match did not finish");
  });

  it("counts a mid-run leak even when lives remain", () => {
    const sim = makeSim({ startingLives: 3, waveCount: 1, startingGold: 0 });
    expect(sim.startWave()).toBe(true);
    for (let i = 0; i < 50_000; i++) {
      const snap = sim.tick(100);
      if (snap.leaks >= 1) {
        expect(snap.lives).toBe(2);
        expect(snap.closestLeakPct).toBe(0);
        return;
      }
      if (snap.phase === "won" || snap.phase === "lost") break;
    }
    throw new Error("never recorded a leak");
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
    const g = firstBuildable(sim);
    placeDefault(sim, g.col, g.row);
    const placed = sim.drainEvents().filter((e) => e.type === "tower_placed");
    expect(placed).toHaveLength(1);
    sim.startWave();
    const waves = sim.drainEvents().filter((e) => e.type === "wave_started");
    expect(waves).toHaveLength(1);
  });

  it("upgrades a tower to tier 2 and refunds invested gold on sell", () => {
    const sim = makeSim({ startingGold: 500 });
    const g = firstBuildable(sim);
    expect(placeDefault(sim, g.col, g.row)).toBe(true);
    const afterPlace = sim.snapshot().gold;
    expect(sim.snapshot().towers[0]!.tier).toBe(1);
    expect(sim.tryUpgradeAt(g.col, g.row)).toBe(true);
    const snap = sim.snapshot();
    expect(snap.towers[0]!.tier).toBe(2);
    expect(snap.gold).toBeLessThan(afterPlace);
    expect(sim.tryUpgradeAt(g.col, g.row)).toBe(false); // max tier
    const beforeSell = sim.snapshot().gold;
    expect(sim.trySellAt(g.col, g.row)).toBe(true);
    // Refund should exceed base-only sell because upgrade gold was invested.
    expect(sim.snapshot().gold).toBeGreaterThan(beforeSell);
  });

  it("emits tower_upgraded events", () => {
    const sim = makeSim({ startingGold: 500 });
    const g = firstBuildable(sim);
    placeDefault(sim, g.col, g.row);
    sim.drainEvents();
    expect(sim.tryUpgradeAt(g.col, g.row)).toBe(true);
    const upgraded = sim.drainEvents().filter((e) => e.type === "tower_upgraded");
    expect(upgraded).toHaveLength(1);
  });

  it("keeps towerKindsUsed after sells for share loadout", () => {
    const sim = makeSim({ startingGold: 500 });
    const a = firstBuildable(sim);
    sim.selectTowerKind("bolt");
    expect(sim.tryPlaceAt(a.col, a.row)).toBe(true);
    // second buildable tile
    let b = a;
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 12; col++) {
        if ((col !== a.col || row !== a.row) && sim.map.isBuildable(col, row)) {
          b = { col, row };
          break;
        }
      }
      if (b !== a) break;
    }
    sim.selectTowerKind("brine");
    expect(sim.tryPlaceAt(b.col, b.row)).toBe(true);
    expect(sim.snapshot().towerKindsUsed).toEqual(["bolt", "brine"]);
    expect(sim.trySellAt(a.col, a.row)).toBe(true);
    expect(sim.trySellAt(b.col, b.row)).toBe(true);
    expect(sim.snapshot().towers).toHaveLength(0);
    expect(sim.snapshot().towerKindsUsed).toEqual(["bolt", "brine"]);
  });

  it("emits tower_fired when towers shoot", () => {
    const sim = makeSim({ startingGold: 5000, waveCount: 1 });
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        sim.selectTowerKind("bolt");
        sim.tryPlaceAt(col, row);
      }
    }
    sim.drainEvents();
    expect(sim.startWave()).toBe(true);
    let fired = false;
    for (let i = 0; i < 5_000; i++) {
      sim.tick(50);
      if (sim.drainEvents().some((e) => e.type === "tower_fired")) {
        fired = true;
        break;
      }
    }
    expect(fired).toBe(true);
  });
  it("awards speed bonus when a wave is cleared under par", () => {
    const sim = makeSim({ startingGold: 5000, waveCount: 1 });
    // Carpet the map so the wave dies instantly after spawns.
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        sim.selectTowerKind(col % 2 === 0 ? "bolt" : "burst");
        sim.tryPlaceAt(col, row);
      }
    }
    expect(sim.startWave()).toBe(true);
    for (let i = 0; i < 20_000; i++) {
      const snap = sim.tick(100);
      if (snap.phase === "won" || snap.phase === "lost") {
        expect(snap.phase).toBe("won");
        expect(snap.speedBonus).toBeGreaterThan(0);
        expect(snap.score).toBeGreaterThan(snap.speedBonus);
        return;
      }
    }
    throw new Error("match did not finish");
  });
});
