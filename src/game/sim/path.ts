/** Polyline path helpers — progress 0..1 along the route. */

export interface Point {
  x: number;
  y: number;
}

export function pathLength(points: readonly Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

/** Map distance traveled → world position (clamped). */
export function pointAtDistance(
  points: readonly Point[],
  distance: number,
): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0]! };

  const total = pathLength(points);
  let d = Math.max(0, Math.min(distance, total));
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= seg || i === points.length - 1) {
      const t = seg === 0 ? 0 : d / seg;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    }
    d -= seg;
  }
  return { ...points[points.length - 1]! };
}

export function progressAlongPath(
  points: readonly Point[],
  distance: number,
): number {
  const total = pathLength(points);
  if (total <= 0) return 1;
  return Math.max(0, Math.min(1, distance / total));
}
