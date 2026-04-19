import type { Point } from "@/types";
import { WALL_SNAP_DISTANCE_IN } from "./constants";

export interface WallSegment {
  a: Point;
  b: Point;
  /** Angle of (b - a) in degrees, CCW from +X axis. */
  angle: number;
  /** Distance along the segment from a → b where the projection landed. */
  t: number;
  /** Projected point on the segment. */
  projected: Point;
  /** Perpendicular distance from the query point to the segment. */
  distance: number;
}

function projectOnto(p: Point, a: Point, b: Point): WallSegment {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  const projected = { x: a.x + t * dx, y: a.y + t * dy };
  const distance = Math.hypot(p.x - projected.x, p.y - projected.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { a, b, angle, t, projected, distance };
}

/**
 * Find the wall segment closest to `p`. Returns null if no segment is within
 * `thresholdInches`.
 */
export function findNearestWall(
  p: Point,
  vertices: Point[],
  thresholdInches = WALL_SNAP_DISTANCE_IN,
): WallSegment | null {
  if (vertices.length < 2) return null;
  let best: WallSegment | null = null;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const seg = projectOnto(p, a, b);
    if (!best || seg.distance < best.distance) best = seg;
  }
  if (!best) return null;
  return best.distance <= thresholdInches ? best : null;
}
