import type {
  ArchElement,
  BoundingBox,
  Point,
  ShelvingSegment,
} from "@/types";
import { pointInPolygon } from "./geometry";

/** Axis-aligned bounding box in the same inch-space as vertices. */
export interface Aabb {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** BoundingBox of an arch element (centered on x/y). */
export function archElementBox(el: ArchElement): BoundingBox {
  return {
    x: el.x,
    y: el.y,
    width: el.widthInches,
    height: el.depthInches,
    rotation: el.rotation,
  };
}

export function shelfBox(s: ShelvingSegment): BoundingBox {
  return {
    x: s.x,
    y: s.y,
    width: s.lengthInches,
    height: s.widthInches,
    rotation: s.rotation,
  };
}

/**
 * Axis-aligned bounding box of a rotated rectangle, where (x, y) is the
 * center point. Rotation in degrees.
 */
export function rotatedAabb(box: BoundingBox): Aabb {
  const rad = (box.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = box.width * cos + box.height * sin;
  const h = box.width * sin + box.height * cos;
  return {
    x: box.x - w / 2,
    y: box.y - h / 2,
    width: w,
    height: h,
  };
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Corners of a rotated rectangle, used for inside-polygon tests. */
export function rotatedCorners(box: BoundingBox): Point[] {
  const rad = (box.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = box.width / 2;
  const hh = box.height / 2;
  return [
    { x: box.x + (-hw * cos - -hh * sin), y: box.y + (-hw * sin + -hh * cos) },
    { x: box.x + (hw * cos - -hh * sin), y: box.y + (hw * sin + -hh * cos) },
    { x: box.x + (hw * cos - hh * sin), y: box.y + (hw * sin + hh * cos) },
    { x: box.x + (-hw * cos - hh * sin), y: box.y + (-hw * sin + hh * cos) },
  ];
}

/** Every corner of `box` must lie inside the room polygon. */
export function insideRoom(
  box: BoundingBox,
  roomVertices: Point[],
): boolean {
  const corners = rotatedCorners(box);
  return corners.every((c) => pointInPolygon(c, roomVertices));
}

export interface CollisionContext {
  selfId: string | null;
  archElements: ArchElement[];
  shelvingSegments: ShelvingSegment[];
  roomVertices: Point[];
}

export function collides(
  box: BoundingBox,
  ctx: CollisionContext,
): { collides: boolean; reason: "overlap" | "outside" | null } {
  if (!insideRoom(box, ctx.roomVertices)) {
    return { collides: true, reason: "outside" };
  }
  const boxAabb = rotatedAabb(box);
  for (const el of ctx.archElements) {
    if (el.id === ctx.selfId) continue;
    if (aabbOverlap(boxAabb, rotatedAabb(archElementBox(el)))) {
      return { collides: true, reason: "overlap" };
    }
  }
  for (const sh of ctx.shelvingSegments) {
    if (sh.id === ctx.selfId) continue;
    if (aabbOverlap(boxAabb, rotatedAabb(shelfBox(sh)))) {
      return { collides: true, reason: "overlap" };
    }
  }
  return { collides: false, reason: null };
}

/**
 * Try the requested position first, then walk outward along the 8 cardinal
 * directions in small increments looking for the first non-colliding spot.
 * Returns the requested box unchanged if no valid neighbour is found.
 */
export function findNonCollidingPosition(
  box: BoundingBox,
  ctx: CollisionContext,
  stepInches = 6,
  maxSteps = 30,
): BoundingBox {
  if (!collides(box, ctx).collides) return box;

  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  for (let step = 1; step <= maxSteps; step++) {
    for (const [dx, dy] of dirs) {
      const candidate: BoundingBox = {
        ...box,
        x: box.x + dx * step * stepInches,
        y: box.y + dy * step * stepInches,
      };
      if (!collides(candidate, ctx).collides) return candidate;
    }
  }
  return box;
}
