import type { Point } from "./path";

export const TILE = 48;
export const MAP_COLS = 12;
export const MAP_ROWS = 16;

/** Harbor path through a 12×16 tile board (tile centers). */
export const HARBOR_PATH_TILES: readonly Point[] = [
  { x: 1, y: 0 },
  { x: 1, y: 4 },
  { x: 4, y: 4 },
  { x: 4, y: 8 },
  { x: 8, y: 8 },
  { x: 8, y: 12 },
  { x: 10, y: 12 },
  { x: 10, y: 15 },
];

export function tileCenter(col: number, row: number): Point {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function harborPathWorld(): Point[] {
  return HARBOR_PATH_TILES.map((t) => tileCenter(t.x, t.y));
}

function pathTileSet(): Set<string> {
  const set = new Set<string>();
  const tiles = HARBOR_PATH_TILES;
  for (let i = 1; i < tiles.length; i++) {
    const a = tiles[i - 1]!;
    const b = tiles[i]!;
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

const PATH_TILES = pathTileSet();

export function isPathTile(col: number, row: number): boolean {
  return PATH_TILES.has(`${col},${row}`);
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < MAP_COLS && row < MAP_ROWS;
}

/** Buildable = in bounds, not on path. */
export function isBuildable(col: number, row: number): boolean {
  return inBounds(col, row) && !isPathTile(col, row);
}

export function worldToTile(x: number, y: number): Point {
  return {
    x: Math.floor(x / TILE),
    y: Math.floor(y / TILE),
  };
}
