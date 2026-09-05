import { describe, expect, it } from "vitest";
import {
  pathLength,
  pointAtDistance,
  progressAlongPath,
} from "../../src/game/sim/path";

describe("path helpers (G1)", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
  ];

  it("measures polyline length", () => {
    expect(pathLength(path)).toBe(150);
  });

  it("interpolates along the path", () => {
    expect(pointAtDistance(path, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAtDistance(path, 50)).toEqual({ x: 50, y: 0 });
    expect(pointAtDistance(path, 100)).toEqual({ x: 100, y: 0 });
    expect(pointAtDistance(path, 125)).toEqual({ x: 100, y: 25 });
    expect(pointAtDistance(path, 999)).toEqual({ x: 100, y: 50 });
  });

  it("reports progress 0..1", () => {
    expect(progressAlongPath(path, 0)).toBe(0);
    expect(progressAlongPath(path, 75)).toBe(0.5);
    expect(progressAlongPath(path, 150)).toBe(1);
  });
});
