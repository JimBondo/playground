import type {
  ArchElement,
  Point,
  ShelvingSegment,
  AlignmentGuide,
} from "@/types";
import {
  SNAP_THRESHOLD_PX,
  ALIGNMENT_THRESHOLD_PX,
} from "@/lib/constants";
import { archElementBox, shelfBox, rotatedAabb } from "@/lib/collision";

export type SnapSource = "element" | "wall" | "grid" | null;

export interface SnapResult {
  x: number;
  y: number;
  source: SnapSource;
  leftNeighborId: string | null;
  rightNeighborId: string | null;
}

export interface SnapContext {
  selfId: string | null;
  widthInches: number;
  heightInches: number;
  rotationDeg: number;
  archElements: ArchElement[];
  shelvingSegments: ShelvingSegment[];
  roomVertices: Point[];
  pixelsPerInch: number;
  gridSpacingInches: number;
  snapToGridActive: boolean;
}

const thresholdInches = (pixelsPerInch: number) =>
  SNAP_THRESHOLD_PX / pixelsPerInch;

/**
 * Priority: element > wall > grid.
 * Candidate position is the center point of the dragged shelf in inches.
 */
export function computeSnap(
  candidate: Point,
  ctx: SnapContext,
): SnapResult {
  const thresh = thresholdInches(ctx.pixelsPerInch);
  const hw = ctx.widthInches / 2;
  const hh = ctx.heightInches / 2;
  const leftEdge = candidate.x - hw;
  const rightEdge = candidate.x + hw;
  const topEdge = candidate.y - hh;
  const bottomEdge = candidate.y + hh;

  // ---- Element snap: flush side-by-side with another shelf ----
  let snapped = { x: candidate.x, y: candidate.y };
  let leftNeighbor: string | null = null;
  let rightNeighbor: string | null = null;
  let source: SnapSource = null;

  for (const other of ctx.shelvingSegments) {
    if (other.id === ctx.selfId) continue;
    if (other.rotation !== ctx.rotationDeg) continue;
    const otherHW = other.lengthInches / 2;
    const otherHH = other.widthInches / 2;
    if (Math.abs(other.y - candidate.y) > thresh + otherHH + hh) continue;

    // Candidate's right edge close to other's left edge (candidate to the left)
    const distRightToLeft = Math.abs(rightEdge - (other.x - otherHW));
    if (
      distRightToLeft <= thresh &&
      Math.abs(other.y - candidate.y) <= thresh
    ) {
      snapped = { x: other.x - otherHW - hw, y: other.y };
      rightNeighbor = other.id;
      source = "element";
      break;
    }
    // Candidate's left edge close to other's right edge (candidate to the right)
    const distLeftToRight = Math.abs(leftEdge - (other.x + otherHW));
    if (
      distLeftToRight <= thresh &&
      Math.abs(other.y - candidate.y) <= thresh
    ) {
      snapped = { x: other.x + otherHW + hw, y: other.y };
      leftNeighbor = other.id;
      source = "element";
      break;
    }
  }

  if (source === "element") {
    return {
      x: snapped.x,
      y: snapped.y,
      source,
      leftNeighborId: leftNeighbor,
      rightNeighborId: rightNeighbor,
    };
  }

  // ---- Wall snap: against interior face of nearest wall edge ----
  // Use axis-aligned bounding box of the room. (Good enough for rect rooms;
  // polygon walls use the same axis-aligned extents in all spec'd templates.)
  const xs = ctx.roomVertices.map((v) => v.x);
  const ys = ctx.roomVertices.map((v) => v.y);
  const roomMinX = Math.min(...xs);
  const roomMaxX = Math.max(...xs);
  const roomMinY = Math.min(...ys);
  const roomMaxY = Math.max(...ys);

  const candLeft = Math.abs(leftEdge - roomMinX);
  const candRight = Math.abs(rightEdge - roomMaxX);
  const candTop = Math.abs(topEdge - roomMinY);
  const candBottom = Math.abs(bottomEdge - roomMaxY);

  let sx = candidate.x;
  let sy = candidate.y;
  let wallHit = false;
  if (candLeft <= thresh) {
    sx = roomMinX + hw;
    wallHit = true;
  } else if (candRight <= thresh) {
    sx = roomMaxX - hw;
    wallHit = true;
  }
  if (candTop <= thresh) {
    sy = roomMinY + hh;
    wallHit = true;
  } else if (candBottom <= thresh) {
    sy = roomMaxY - hh;
    wallHit = true;
  }
  if (wallHit) {
    return {
      x: sx,
      y: sy,
      source: "wall",
      leftNeighborId: null,
      rightNeighborId: null,
    };
  }

  // ---- Grid snap ----
  if (ctx.snapToGridActive) {
    const step = ctx.gridSpacingInches;
    return {
      x: Math.round(candidate.x / step) * step,
      y: Math.round(candidate.y / step) * step,
      source: "grid",
      leftNeighborId: null,
      rightNeighborId: null,
    };
  }

  return {
    x: candidate.x,
    y: candidate.y,
    source: null,
    leftNeighborId: null,
    rightNeighborId: null,
  };
}

/**
 * Figma-style alignment guides: any other element whose center or edge aligns
 * (within ALIGNMENT_THRESHOLD_PX, converted to inches) produces a guide.
 */
export function computeAlignmentGuides(
  candidate: Point,
  ctx: SnapContext,
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const threshIn = ALIGNMENT_THRESHOLD_PX / ctx.pixelsPerInch;
  const hw = ctx.widthInches / 2;
  const hh = ctx.heightInches / 2;

  const candidates = [
    { axis: "h" as const, pos: candidate.y, type: "center" as const },
    { axis: "h" as const, pos: candidate.y - hh, type: "edge" as const },
    { axis: "h" as const, pos: candidate.y + hh, type: "edge" as const },
    { axis: "v" as const, pos: candidate.x, type: "center" as const },
    { axis: "v" as const, pos: candidate.x - hw, type: "edge" as const },
    { axis: "v" as const, pos: candidate.x + hw, type: "edge" as const },
  ];

  const others: Array<{
    cx: number; cy: number; hw: number; hh: number;
  }> = [];
  for (const s of ctx.shelvingSegments) {
    if (s.id === ctx.selfId) continue;
    const aabb = rotatedAabb(shelfBox(s));
    others.push({
      cx: aabb.x + aabb.width / 2,
      cy: aabb.y + aabb.height / 2,
      hw: aabb.width / 2,
      hh: aabb.height / 2,
    });
  }
  for (const e of ctx.archElements) {
    if (e.id === ctx.selfId) continue;
    const aabb = rotatedAabb(archElementBox(e));
    others.push({
      cx: aabb.x + aabb.width / 2,
      cy: aabb.y + aabb.height / 2,
      hw: aabb.width / 2,
      hh: aabb.height / 2,
    });
  }

  for (const c of candidates) {
    for (const o of others) {
      if (c.axis === "h") {
        const matches = [o.cy, o.cy - o.hh, o.cy + o.hh];
        for (const m of matches) {
          if (Math.abs(c.pos - m) <= threshIn) {
            guides.push({
              orientation: "horizontal",
              position: m * ctx.pixelsPerInch,
              type: c.type,
            });
          }
        }
      } else {
        const matches = [o.cx, o.cx - o.hw, o.cx + o.hw];
        for (const m of matches) {
          if (Math.abs(c.pos - m) <= threshIn) {
            guides.push({
              orientation: "vertical",
              position: m * ctx.pixelsPerInch,
              type: c.type,
            });
          }
        }
      }
    }
  }

  // Deduplicate within 0.5 pixel.
  const seen = new Set<string>();
  return guides.filter((g) => {
    const key = `${g.orientation}:${Math.round(g.position * 2)}:${g.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
