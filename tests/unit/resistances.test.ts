import { describe, expect, it } from "vitest";
import {
  createRng,
  pickEnemyKind,
  buildSpawnSchedule,
} from "../../src/game/daily/seed";
import {
  BRINE_CORRODE_MULT,
  damageTakenMultiplier,
  ENEMY_STATS,
} from "../../src/game/sim/enemies";
import { towerStats } from "../../src/game/sim/towers";

describe("enemy resistances", () => {
  it("makes swarms shrug off bolt and melt to burst", () => {
    expect(damageTakenMultiplier("swarm", "bolt")).toBeLessThan(0.4);
    expect(damageTakenMultiplier("swarm", "burst")).toBeGreaterThan(1.2);
  });

  it("makes tanks resist bolt/burst and take brine hard", () => {
    expect(damageTakenMultiplier("tank", "bolt")).toBeLessThan(0.55);
    expect(damageTakenMultiplier("tank", "burst")).toBeLessThan(0.6);
    expect(damageTakenMultiplier("tank", "brine")).toBeGreaterThan(1.2);
  });

  it("keeps runners vulnerable to bolt so early game still teaches the loop", () => {
    expect(damageTakenMultiplier("runner", "bolt")).toBeGreaterThan(1);
  });

  it("amps bolt damage on a brine-corroded tank", () => {
    const bolt = towerStats("bolt", 1).damage;
    const raw = Math.round(bolt * damageTakenMultiplier("tank", "bolt"));
    const corroded = Math.round(
      bolt * damageTakenMultiplier("tank", "bolt") * BRINE_CORRODE_MULT,
    );
    expect(corroded).toBeGreaterThan(raw);
    expect(raw).toBeGreaterThan(0);
  });
});

describe("wave composition bias", () => {
  it("shifts toward swarm/tank in late waves", () => {
    const early = { runner: 0, swarm: 0, tank: 0 };
    const late = { runner: 0, swarm: 0, tank: 0 };
    for (let i = 0; i < 300; i++) {
      const rng = createRng(1000 + i);
      early[pickEnemyKind(rng, 0, 8)] += 1;
      late[pickEnemyKind(rng, 7, 8)] += 1;
    }
    expect(early.runner).toBeGreaterThan(late.runner);
    expect(late.swarm + late.tank).toBeGreaterThan(early.swarm + early.tank);
  });

  it("still builds deterministic schedules", () => {
    expect(buildSpawnSchedule(42, 8)).toEqual(buildSpawnSchedule(42, 8));
    expect(ENEMY_STATS.tank.hp).toBeGreaterThan(ENEMY_STATS.runner.hp);
  });
});
