import { describe, expect, it } from "vitest";
import {
  aabbOverlap,
  rotatedAabb,
  insideRoom,
  collides,
  findNonCollidingPosition,
} from "@/lib/collision";

const room = [
  { x: 0, y: 0 },
  { x: 600, y: 0 },
  { x: 600, y: 360 },
  { x: 0, y: 360 },
];

describe("collision", () => {
  it("AABB overlap detects touching/disjoint pairs", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    const c = { x: 20, y: 20, width: 5, height: 5 };
    const d = { x: 10, y: 10, width: 5, height: 5 }; // share an edge
    expect(aabbOverlap(a, b)).toBe(true);
    expect(aabbOverlap(a, c)).toBe(false);
    expect(aabbOverlap(a, d)).toBe(false);
  });

  it("rotatedAabb centers the box on x/y", () => {
    const b = rotatedAabb({ x: 100, y: 100, width: 20, height: 10, rotation: 0 });
    expect(b).toEqual({ x: 90, y: 95, width: 20, height: 10 });
  });

  it("rotatedAabb expands for 90° rotation (swap width/height)", () => {
    const b = rotatedAabb({ x: 0, y: 0, width: 20, height: 10, rotation: 90 });
    expect(Math.round(b.width)).toBe(10);
    expect(Math.round(b.height)).toBe(20);
  });

  it("insideRoom is true for inside, false for overlapping wall", () => {
    expect(
      insideRoom(
        { x: 100, y: 100, width: 50, height: 50, rotation: 0 },
        room,
      ),
    ).toBe(true);
    expect(
      insideRoom(
        { x: -10, y: 100, width: 50, height: 50, rotation: 0 },
        room,
      ),
    ).toBe(false);
  });

  it("collides reports overlap and outside reasons", () => {
    const ctx = {
      selfId: null,
      archElements: [
        {
          id: "e1",
          type: "outlet" as const,
          x: 100,
          y: 100,
          rotation: 0,
          widthInches: 4,
          depthInches: 4,
        },
      ],
      shelvingSegments: [],
      roomVertices: room,
    };
    const overlap = collides(
      { x: 100, y: 100, width: 4, height: 4, rotation: 0 },
      ctx,
    );
    expect(overlap.collides).toBe(true);
    expect(overlap.reason).toBe("overlap");

    const outside = collides(
      { x: -50, y: 100, width: 4, height: 4, rotation: 0 },
      ctx,
    );
    expect(outside.collides).toBe(true);
    expect(outside.reason).toBe("outside");

    const ok = collides(
      { x: 300, y: 200, width: 4, height: 4, rotation: 0 },
      ctx,
    );
    expect(ok.collides).toBe(false);
  });

  it("findNonCollidingPosition moves the box to a valid spot", () => {
    const ctx = {
      selfId: null,
      archElements: [
        {
          id: "e1",
          type: "freezerChest" as const,
          x: 100,
          y: 100,
          rotation: 0,
          widthInches: 72,
          depthInches: 30,
        },
      ],
      shelvingSegments: [],
      roomVertices: room,
    };
    const box = { x: 100, y: 100, width: 72, height: 30, rotation: 0 };
    const placed = findNonCollidingPosition(box, ctx, 6, 20);
    expect(collides(placed, ctx).collides).toBe(false);
  });
});
