import { createRng } from "../daily/seed";
import type { Point } from "./path";

export const TILE = 48;
export const MAP_COLS = 12;
export const MAP_ROWS = 16;

/** Classic harbor waypoints — kept as a readable fixture / fallback. */
export const CLASSIC_HARBOR_WAYPOINTS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: 1, y: 4 },
  { x: 4, y: 4 },
  { x: 4, y: 8 },
  { x: 8, y: 8 },
  { x: 8, y: 12 },
  { x: 10, y: 12 },
  { x: 10, y: 15 },
];

/** @deprecated Prefer createMapLayout(seed).waypoints for daily boards. */
export const HARBOR_PATH_TILES = CLASSIC_HARBOR_WAYPOINTS;

export function tileCenter(col: number, row: number): Point {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < MAP_COLS && row < MAP_ROWS;
}

export function worldToTile(x: number, y: number): Point {
  return {
    x: Math.floor(x / TILE),
    y: Math.floor(y / TILE),
  };
}

/** Expand orthogonal waypoints into every tile the path covers. */
export function expandWaypointsToTiles(
  waypoints: readonly Point[],
): Set<string> {
  const set = new Set<string>();
  if (waypoints.length === 0) return set;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1]!;
    const b = waypoints[i]!;
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    let x = a.x;
    let y = a.y;
    set.add(`${x},${y}`);
    while (x !== b.x || y !== b.y) {
      x += dx;
      y += dy;
      set.add(`${x},${y}`);
    }
  }
  return set;
}

/**
 * Deterministic winding harbor path from a daily seed.
 * Starts at the north edge (spawn) and ends at the south edge (gate).
 */
export function generateHarborWaypoints(seed: number): Point[] {
  const rng = createRng(seed ^ 0x61a7e4d);
  let x = 1 + Math.floor(rng() * (MAP_COLS - 2));
  let y = 0;
  const pts: Point[] = [{ x, y }];
  const bottom = MAP_ROWS - 1;
  let guard = 0;

  while (y < bottom && guard++ < 48) {
    const progress = y / bottom;
    const preferDown = rng() < 0.42 + progress * 0.4;
    if (preferDown) {
      const step = 2 + Math.floor(rng() * 3); // 2–4
      y = Math.min(bottom, y + step);
      pts.push({ x, y });
      continue;
    }

    const goLeft = rng() < 0.5;
    const step = 2 + Math.floor(rng() * 3);
    const nx = goLeft
      ? Math.max(1, x - step)
      : Math.min(MAP_COLS - 2, x + step);
    if (nx === x) {
      y = Math.min(bottom, y + 2);
      pts.push({ x, y });
    } else {
      x = nx;
      pts.push({ x, y });
    }
  }

  if (pts[pts.length - 1]!.y !== bottom) {
    pts.push({ x, y: bottom });
  }

  // Collapse consecutive duplicates.
  const cleaned: Point[] = [];
  for (const p of pts) {
    const last = cleaned[cleaned.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) cleaned.push(p);
  }
  return cleaned;
}

export interface MapLayout {
  seed: number;
  /** Corner waypoints (orthogonal). */
  waypoints: Point[];
  /** World-space polyline through tile centers. */
  pathWorld: Point[];
  /** Spawn tile (path start). */
  spawnTile: Point;
  /** Gate tile (path end). */
  gateTile: Point;
  isPathTile(col: number, row: number): boolean;
  isBuildable(col: number, row: number): boolean;
  /** Count of off-path buildable tiles. */
  buildableCount: number;
}

export function createMapLayout(seed: number): MapLayout {
  const waypoints = generateHarborWaypoints(seed);
  const pathSet = expandWaypointsToTiles(waypoints);
  const pathWorld = waypoints.map((t) => tileCenter(t.x, t.y));
  let buildableCount = 0;
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      if (!pathSet.has(`${col},${row}`)) buildableCount += 1;
    }
  }
  const spawnTile = waypoints[0]!;
  const gateTile = waypoints[waypoints.length - 1]!;

  return {
    seed,
    waypoints,
    pathWorld,
    spawnTile,
    gateTile,
    buildableCount,
    isPathTile(col, row) {
      return pathSet.has(`${col},${row}`);
    },
    isBuildable(col, row) {
      return inBounds(col, row) && !pathSet.has(`${col},${row}`);
    },
  };
}

let classicCache: MapLayout | null = null;

/** Classic static layout (tests / fixtures). */
export function classicMapLayout(): MapLayout {
  if (classicCache) return classicCache;
  const waypoints = CLASSIC_HARBOR_WAYPOINTS.map((p) => ({ ...p }));
  const pathSet = expandWaypointsToTiles(waypoints);
  const pathWorld = waypoints.map((t) => tileCenter(t.x, t.y));
  let buildableCount = 0;
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      if (!pathSet.has(`${col},${row}`)) buildableCount += 1;
    }
  }
  classicCache = {
    seed: 0,
    waypoints,
    pathWorld,
    spawnTile: waypoints[0]!,
    gateTile: waypoints[waypoints.length - 1]!,
    buildableCount,
    isPathTile(col, row) {
      return pathSet.has(`${col},${row}`);
    },
    isBuildable(col, row) {
      return inBounds(col, row) && !pathSet.has(`${col},${row}`);
    },
  };
  return classicCache;
}

/** @deprecated Use layout.pathWorld from createMapLayout(seed). */
export function harborPathWorld(): Point[] {
  return classicMapLayout().pathWorld;
}

/** @deprecated Use layout.isPathTile from the active MapLayout. */
export function isPathTile(col: number, row: number): boolean {
  return classicMapLayout().isPathTile(col, row);
}

/** @deprecated Use layout.isBuildable from the active MapLayout. */
export function isBuildable(col: number, row: number): boolean {
  return classicMapLayout().isBuildable(col, row);
}
