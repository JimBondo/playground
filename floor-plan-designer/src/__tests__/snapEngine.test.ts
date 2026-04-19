import { describe, expect, it } from "vitest";
import { computeSnap, computeAlignmentGuides } from "@/hooks/useSnapEngine";
import type { ArchElement, ShelvingSegment } from "@/types";

const roomVertices = [
  { x: 0, y: 0 },
  { x: 600, y: 0 },
  { x: 600, y: 360 },
  { x: 0, y: 360 },
];

function shelf(
  id: string,
  x: number,
  y: number,
  len = 48,
  width = 24,
  rotation = 0,
): ShelvingSegment {
  return {
    id,
    type: "standard",
    lengthInches: len,
    widthInches: width,
    heightInches: 84,
    x,
    y,
    rotation,
    powerSource: { connectedOutletId: null, daisyChainedFrom: null },
    snappedConnections: { leftId: null, rightId: null },
  };
}

function baseCtx() {
  return {
    selfId: "dragged",
    widthInches: 48,
    heightInches: 24,
    rotationDeg: 0,
    archElements: [] as ArchElement[],
    shelvingSegments: [] as ShelvingSegment[],
    roomVertices,
    pixelsPerInch: 4,
    gridSpacingInches: 12,
    snapToGridActive: false,
  };
}

describe("snap engine — element snap", () => {
  it("snaps flush against the right edge of another shelf", () => {
    const existing = shelf("a", 100, 100); // center at 100,100 → right edge 124
    const ctx = { ...baseCtx(), shelvingSegments: [existing] };
    // Drag candidate very close: center at 150,100 → left edge at 126.
    // Distance 2" = 8px @ 4ppi → below 15px threshold.
    const snap = computeSnap({ x: 150, y: 100 }, ctx);
    expect(snap.source).toBe("element");
    expect(snap.x).toBe(148);
    expect(snap.leftNeighborId).toBe("a");
  });

  it("does not snap beyond the threshold", () => {
    const existing = shelf("a", 100, 100);
    const ctx = { ...baseCtx(), shelvingSegments: [existing] };
    // 200 is well away.
    const snap = computeSnap({ x: 200, y: 100 }, ctx);
    expect(snap.source).toBeNull();
  });
});

describe("snap engine — wall snap", () => {
  it("snaps to interior of left wall", () => {
    const ctx = baseCtx();
    // Candidate left edge near x=0. center x=25 → left edge 1" → snap to x=24
    const snap = computeSnap({ x: 25, y: 200 }, ctx);
    expect(snap.source).toBe("wall");
    expect(snap.x).toBe(24); // half-width (48/2)
  });
});

describe("snap engine — grid snap", () => {
  it("rounds to nearest grid intersection when active", () => {
    const ctx = { ...baseCtx(), snapToGridActive: true };
    // Drag candidate at 110 → grid 108 (12" spacing × 9) is nearer than 120.
    const snap = computeSnap({ x: 110, y: 200 }, ctx);
    expect(snap.source).toBe("grid");
    expect(snap.x).toBe(108);
    expect(snap.y).toBe(204);
  });

  it("grid snap is suppressed by element snap (priority)", () => {
    const existing = shelf("a", 100, 100);
    const ctx = {
      ...baseCtx(),
      shelvingSegments: [existing],
      snapToGridActive: true,
    };
    const snap = computeSnap({ x: 150, y: 100 }, ctx);
    expect(snap.source).toBe("element");
  });

  it("grid snap is suppressed by wall snap (priority)", () => {
    const ctx = { ...baseCtx(), snapToGridActive: true };
    const snap = computeSnap({ x: 25, y: 200 }, ctx);
    expect(snap.source).toBe("wall");
  });
});

describe("alignment guides", () => {
  it("emits guides when a center matches another shelf's center", () => {
    const existing = shelf("a", 200, 100);
    const ctx = { ...baseCtx(), shelvingSegments: [existing] };
    const guides = computeAlignmentGuides({ x: 400, y: 100 }, ctx);
    // y centers match → horizontal guide
    expect(guides.some((g) => g.orientation === "horizontal")).toBe(true);
  });

  it("returns no guides when elements are unaligned", () => {
    const existing = shelf("a", 200, 100);
    const ctx = { ...baseCtx(), shelvingSegments: [existing] };
    const guides = computeAlignmentGuides({ x: 400, y: 300 }, ctx);
    expect(guides).toHaveLength(0);
  });
});
