import { describe, expect, it } from "vitest";
import { findNearestWall } from "@/lib/wallSnap";

const rect = [
  { x: 0, y: 0 },
  { x: 240, y: 0 },
  { x: 240, y: 120 },
  { x: 0, y: 120 },
];

describe("findNearestWall", () => {
  it("snaps to the nearest wall when within threshold", () => {
    const hit = findNearestWall({ x: 120, y: 3 }, rect, 24);
    expect(hit).not.toBeNull();
    expect(hit!.projected.x).toBe(120);
    expect(hit!.projected.y).toBe(0);
    expect(Math.round(hit!.angle)).toBe(0);
  });

  it("returns null when beyond threshold", () => {
    const hit = findNearestWall({ x: 120, y: 60 }, rect, 10);
    expect(hit).toBeNull();
  });

  it("picks the correct wall for a right-wall point", () => {
    const hit = findNearestWall({ x: 235, y: 70 }, rect, 24);
    expect(hit).not.toBeNull();
    expect(hit!.projected.x).toBe(240);
    expect(hit!.projected.y).toBe(70);
  });
});
