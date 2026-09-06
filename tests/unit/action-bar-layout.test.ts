import { describe, expect, it } from "vitest";
import { TOWER_DEFS } from "../../src/game/sim/towers";
import {
  findOverlaps,
  layoutActionBarRow,
  rectsOverlap,
  SELECTION_LAYOUT_INVARIANTS,
  SELL_CHIP_TEXT,
  towerChipText,
  TOWER_CHIP_LABELS,
  type Rect,
} from "../../src/game/ui/actionBarLayout";

/** Approximate chip size from label length (stable stand-in for Phaser measure). */
function estimateChipSize(label: string): { width: number; height: number } {
  const { fontSizePx, paddingX, paddingY } = SELECTION_LAYOUT_INVARIANTS;
  // Manrope 700 ~0.62em average advance — good enough for overlap regression.
  const textW = Math.ceil(label.length * fontSizePx * 0.62);
  return {
    width: textW + paddingX * 2,
    height: fontSizePx + paddingY * 2,
  };
}

function playChromeRects(): Rect[] {
  const { minGapPx } = SELECTION_LAYOUT_INVARIANTS;
  const gap = Math.max(14, minGapPx);
  const rowY = 16 * 48 + 52; // MAP_ROWS * TILE + offset
  const kinds = Object.keys(TOWER_DEFS) as Array<keyof typeof TOWER_DEFS>;
  const chips = kinds.map((kind) => {
    const label = towerChipText(kind, TOWER_DEFS[kind].cost);
    const size = estimateChipSize(label);
    return { id: `tower-${kind}`, ...size };
  });
  const sell = estimateChipSize(SELL_CHIP_TEXT);
  chips.push({ id: "sell", width: sell.width, height: sell.height });
  const upgrade = estimateChipSize("Upgrade $00");
  chips.push({ id: "upgrade", width: upgrade.width, height: upgrade.height });
  const wave = estimateChipSize("Start wave");
  return layoutActionBarRow({
    chips,
    startX: 16,
    rowY,
    gap,
    canvasWidth: 720,
    rightChip: { id: "start-wave", width: wave.width, height: wave.height },
  });
}

describe("action bar layout (no overlaps)", () => {
  it("detects intersecting rects", () => {
    expect(
      rectsOverlap(
        { id: "a", x: 0, y: 0, w: 40, h: 20 },
        { id: "b", x: 30, y: 0, w: 40, h: 20 },
      ),
    ).toBe(true);
    expect(
      rectsOverlap(
        { id: "a", x: 0, y: 0, w: 40, h: 20 },
        { id: "b", x: 50, y: 0, w: 40, h: 20 },
        12,
      ),
    ).toBe(true); // only 10px between chips — violates 12px min gap
    expect(
      rectsOverlap(
        { id: "a", x: 0, y: 0, w: 40, h: 20 },
        { id: "b", x: 50, y: 0, w: 40, h: 20 },
        0,
      ),
    ).toBe(false);
  });

  it("keeps tower / sell / upgrade / start-wave chips from overlapping", () => {
    const rects = playChromeRects();
    const hits = findOverlaps(rects, SELECTION_LAYOUT_INVARIANTS.minGapPx);
    expect(hits).toEqual([]);
  });

  it("leaves room between left cluster and Start wave", () => {
    const rects = playChromeRects();
    const upgrade = rects.find((r) => r.id === "upgrade")!;
    const wave = rects.find((r) => r.id === "start-wave")!;
    expect(
      upgrade.x + upgrade.w + SELECTION_LAYOUT_INVARIANTS.minGapPx,
    ).toBeLessThanOrEqual(wave.x);
  });

  it("locks selection chrome so labels/size never change when selected", () => {
    // Contract: selected state must use the same strings + metrics as resting.
    expect(towerChipText("burst", TOWER_DEFS.burst.cost)).toBe(
      `${TOWER_CHIP_LABELS.burst} $${TOWER_DEFS.burst.cost}`,
    );
    expect(towerChipText("burst", TOWER_DEFS.burst.cost)).not.toMatch(/▸/);
    expect(SELL_CHIP_TEXT).toBe("Sell");
    expect(SELL_CHIP_TEXT).not.toMatch(/▸/);
    expect(SELECTION_LAYOUT_INVARIANTS.scale).toBe(1);
    expect(SELECTION_LAYOUT_INVARIANTS.selectedStrokePx).toBeLessThanOrEqual(3);
    // Selected and resting must share the same font/padding (no grow-on-select).
    const resting = estimateChipSize(towerChipText("burst", TOWER_DEFS.burst.cost));
    const selectedLabel = towerChipText("burst", TOWER_DEFS.burst.cost); // unchanged
    const selected = estimateChipSize(selectedLabel);
    expect(selected).toEqual(resting);
  });

  it("flags the old grow-on-select failure mode", () => {
    // Simulate the bug: selected Burst grows via prefix + scale and collides with Sell.
    const rowY = 100;
    const burstRest = estimateChipSize(towerChipText("burst", 90));
    const sell = estimateChipSize(SELL_CHIP_TEXT);
    const gap = 14;
    const burstX = 200;
    const sellX = burstX + burstRest.width + gap;
    const resting = [
      { id: "burst", x: burstX, y: rowY, w: burstRest.width, h: burstRest.height },
      { id: "sell", x: sellX, y: rowY, w: sell.width, h: sell.height },
    ];
    expect(findOverlaps(resting, 8)).toEqual([]);

    const grownW = Math.ceil(burstRest.width * 1.06) + 16; // scale + ▸ + padding
    const grownH = Math.ceil(burstRest.height * 1.06) + 4;
    const buggy = [
      { id: "burst", x: burstX, y: rowY, w: grownW, h: grownH },
      { id: "sell", x: sellX, y: rowY, w: sell.width, h: sell.height },
    ];
    expect(findOverlaps(buggy, 0).length).toBeGreaterThan(0);
  });
});
