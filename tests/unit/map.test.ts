import { describe, expect, it } from "vitest";
import {
  classicMapLayout,
  createMapLayout,
  generateHarborWaypoints,
  MAP_COLS,
  MAP_ROWS,
  TILE,
  worldToTile,
} from "../../src/game/sim/map";
import { dailySeed } from "../../src/game/daily/seed";

describe("harbor map layout", () => {
  it("classic layout marks path tiles as non-buildable", () => {
    const map = classicMapLayout();
    expect(map.isPathTile(1, 0)).toBe(true);
    expect(map.isBuildable(1, 0)).toBe(false);
    expect(map.isPathTile(0, 0)).toBe(false);
    expect(map.isBuildable(0, 0)).toBe(true);
  });

  it("converts world coords to tiles", () => {
    expect(worldToTile(TILE / 2, TILE / 2)).toEqual({ x: 0, y: 0 });
    expect(worldToTile(TILE * 3 + 1, TILE * 2 + 1)).toEqual({ x: 3, y: 2 });
  });

  it("builds a seeded path from north spawn to south gate", () => {
    const map = createMapLayout(42);
    expect(map.spawnTile.y).toBe(0);
    expect(map.gateTile.y).toBe(MAP_ROWS - 1);
    expect(map.spawnTile.x).toBeGreaterThanOrEqual(1);
    expect(map.spawnTile.x).toBeLessThan(MAP_COLS - 1);
    expect(map.isPathTile(map.spawnTile.x, map.spawnTile.y)).toBe(true);
    expect(map.isPathTile(map.gateTile.x, map.gateTile.y)).toBe(true);
    expect(map.buildableCount).toBeGreaterThan(40);
    expect(map.pathWorld.length).toBeGreaterThan(2);
  });

  it("changes path shape across different daily seeds", () => {
    const today = dailySeed(new Date(Date.UTC(2026, 8, 6)));
    const yesterday = dailySeed(new Date(Date.UTC(2026, 8, 5)));
    expect(today.seed).not.toBe(yesterday.seed);

    const a = generateHarborWaypoints(today.seed);
    const b = generateHarborWaypoints(yesterday.seed);
    const key = (pts: { x: number; y: number }[]) =>
      pts.map((p) => `${p.x},${p.y}`).join("|");
    expect(key(a)).not.toBe(key(b));

    // Lateral variety — not a straight north→south corridor.
    const xs = new Set(a.map((p) => p.x));
    expect(xs.size).toBeGreaterThanOrEqual(3);
  });

  it("wires MatchSim path to the daily layout", async () => {
    const { MatchSim } = await import("../../src/game/sim/match");
    const a = new MatchSim({
      seed: 111,
      dateKey: "2026-09-06",
      mode: "official",
      attemptNumber: 1,
      waveCount: 1,
    });
    const b = new MatchSim({
      seed: 222,
      dateKey: "2026-09-05",
      mode: "official",
      attemptNumber: 1,
      waveCount: 1,
    });
    expect(a.map.waypoints).not.toEqual(b.map.waypoints);
    expect(a.map.waypoints).toEqual(createMapLayout(111).waypoints);
  });

  it("is deterministic for the same seed", () => {
    const a = createMapLayout(99_001);
    const b = createMapLayout(99_001);
    expect(a.waypoints).toEqual(b.waypoints);
    expect(a.buildableCount).toBe(b.buildableCount);
  });
});
