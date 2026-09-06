/**
 * Pure action-bar layout helpers — keep chrome chips from overlapping.
 * Used by PlayScene and unit tests (no Phaser dependency).
 */

export interface Rect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChipSpec {
  id: string;
  /** Measured/display width of the chip at rest (selected state must match). */
  width: number;
  height: number;
}

/** True when two axis-aligned rects intersect or violate minGap. */
export function rectsOverlap(a: Rect, b: Rect, minGap = 0): boolean {
  return !(
    a.x + a.w + minGap <= b.x ||
    b.x + b.w + minGap <= a.x ||
    a.y + a.h + minGap <= b.y ||
    b.y + b.h + minGap <= a.y
  );
}

/** Pairwise overlaps (ids). Empty ⇒ layout is clean. */
export function findOverlaps(
  rects: readonly Rect[],
  minGap = 0,
): Array<[string, string]> {
  const hits: Array<[string, string]> = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!;
      const b = rects[j]!;
      if (rectsOverlap(a, b, minGap)) hits.push([a.id, b.id]);
    }
  }
  return hits;
}

/**
 * Left-to-right chip row, optional right-aligned chip (Start wave).
 * Positions are stable — callers must not resize chips after layout.
 */
export function layoutActionBarRow(input: {
  chips: ChipSpec[];
  startX: number;
  rowY: number;
  gap: number;
  canvasWidth: number;
  rightChip?: ChipSpec;
}): Rect[] {
  const { chips, startX, rowY, gap, canvasWidth, rightChip } = input;
  const rects: Rect[] = [];
  let x = startX;
  for (const chip of chips) {
    rects.push({ id: chip.id, x, y: rowY, w: chip.width, h: chip.height });
    x += chip.width + gap;
  }
  if (rightChip) {
    const rx = canvasWidth - 16 - rightChip.width;
    rects.push({
      id: rightChip.id,
      x: rx,
      y: rowY,
      w: rightChip.width,
      h: rightChip.height,
    });
  }
  return rects;
}

/** Short labels — selection chrome must never change these strings. */
export const TOWER_CHIP_LABELS: Record<"bolt" | "brine" | "burst", string> = {
  bolt: "Bolt",
  brine: "Brine",
  burst: "Burst",
};

export function towerChipText(
  kind: "bolt" | "brine" | "burst",
  cost: number,
): string {
  return `${TOWER_CHIP_LABELS[kind]} $${cost}`;
}

export const SELL_CHIP_TEXT = "Sell";

/**
 * Selection must be color/alpha/stroke only — never text, fontSize, padding, or scale.
 * Tests lock this contract so chips cannot grow into neighbors.
 */
export const SELECTION_LAYOUT_INVARIANTS = {
  fontSizePx: 14,
  paddingX: 12,
  paddingY: 10,
  scale: 1,
  /** Stroke draws outside glyphs; keep thin so it does not eat neighbors. */
  selectedStrokePx: 2,
  unselectedStrokePx: 0,
  minGapPx: 8,
} as const;
