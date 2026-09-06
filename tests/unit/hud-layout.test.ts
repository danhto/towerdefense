import { describe, expect, it } from "vitest";
import { hudAnchorAwayFromSpawn } from "../../src/game/ui/hudLayout";

describe("hud layout vs IN label", () => {
  it("parks the panel on the right when spawn is on the left", () => {
    const a = hudAnchorAwayFromSpawn({
      viewWidth: 720,
      spawnCol: 1,
      spawnLabelY: 44,
      hudWidth: 280,
      hudHeight: 70,
    });
    expect(a.originX).toBe(1);
    expect(a.x).toBeGreaterThan(400);
  });

  it("parks the panel on the left when spawn is on the right", () => {
    const a = hudAnchorAwayFromSpawn({
      viewWidth: 720,
      spawnCol: 10,
      spawnLabelY: 44,
      hudWidth: 280,
      hudHeight: 70,
    });
    expect(a.originX).toBe(0);
    expect(a.x).toBeLessThan(100);
  });

  it("nudges below a top-edge IN when the preferred side still overlaps", () => {
    // Narrow HUD forced onto the same half as spawn — vertical nudge kicks in.
    const a = hudAnchorAwayFromSpawn({
      viewWidth: 200,
      spawnCol: 1,
      spawnLabelY: 44,
      hudWidth: 180,
      hudHeight: 70,
      chromePad: 8,
    });
    expect(a.y).toBeGreaterThan(18);
  });
});
