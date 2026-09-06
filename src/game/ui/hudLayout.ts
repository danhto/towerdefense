import { MAP_COLS, TILE } from "../sim/map";

export interface HudAnchorInput {
  /** Canvas / scene width in px. */
  viewWidth: number;
  /** Spawn tile column (0-based). */
  spawnCol: number;
  /** World Y of the IN label center. */
  spawnLabelY: number;
  /** Approx IN chip half-width. */
  labelHalfW?: number;
  /** Approx IN chip half-height. */
  labelHalfH?: number;
  chromePad?: number;
  hudWidth: number;
  hudHeight: number;
}

export interface HudAnchor {
  x: number;
  y: number;
  /** 0 = left-aligned text, 1 = right-aligned. */
  originX: number;
}

/**
 * Park the stats panel on the side opposite the IN label so top-edge
 * spawns never sit under GOLD/LIVES/SCORE.
 */
export function hudAnchorAwayFromSpawn(input: HudAnchorInput): HudAnchor {
  const chromePad = input.chromePad ?? 16;
  const labelHalfW = input.labelHalfW ?? 28;
  const labelHalfH = input.labelHalfH ?? 14;
  const spawnX = input.spawnCol * TILE + TILE / 2;
  const inLeft = spawnX - labelHalfW;
  const inRight = spawnX + labelHalfW;
  const inBottom = input.spawnLabelY + labelHalfH;

  const preferRight = input.spawnCol < MAP_COLS / 2;
  const originX = preferRight ? 1 : 0;
  const x = preferRight
    ? input.viewWidth - chromePad - 12
    : chromePad + 12;

  // Top band: if IN sits in the top ~64px, nudge HUD below it when
  // horizontally overlapping the preferred side (belt-and-suspenders).
  let y = 18;
  const hudLeft = originX === 1 ? x - input.hudWidth : x;
  const hudRight = hudLeft + input.hudWidth;
  const overlapsX = hudRight > inLeft - 10 && hudLeft < inRight + 10;
  if (overlapsX && inBottom > 8) {
    y = Math.max(y, Math.ceil(inBottom + 10));
  }

  return { x, y, originX };
}
