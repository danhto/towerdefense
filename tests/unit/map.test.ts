import { describe, expect, it } from "vitest";
import {
  isBuildable,
  isPathTile,
  TILE,
  worldToTile,
} from "../../src/game/sim/map";

describe("harbor map (G1)", () => {
  it("marks path tiles as non-buildable", () => {
    expect(isPathTile(1, 0)).toBe(true);
    expect(isBuildable(1, 0)).toBe(false);
  });

  it("allows buildable off-path tiles", () => {
    expect(isPathTile(0, 0)).toBe(false);
    expect(isBuildable(0, 0)).toBe(true);
  });

  it("converts world coords to tiles", () => {
    expect(worldToTile(TILE / 2, TILE / 2)).toEqual({ x: 0, y: 0 });
    expect(worldToTile(TILE * 3 + 1, TILE * 2 + 1)).toEqual({ x: 3, y: 2 });
  });
});
