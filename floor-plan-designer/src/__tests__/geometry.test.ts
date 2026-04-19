import { describe, expect, it } from "vitest";
import {
  distance,
  polygonArea,
  pointInPolygon,
  midpoint,
  formatFeetInches,
  polygonSquareFeet,
} from "@/lib/geometry";

describe("geometry", () => {
  it("distance is Euclidean", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("midpoint averages coordinates", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });

  it("polygonArea handles a unit square", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(square)).toBe(100);
  });

  it("polygonArea is winding-order agnostic", () => {
    const cw = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];
    expect(polygonArea(cw)).toBe(100);
  });

  it("polygonArea returns 0 for degenerate input", () => {
    expect(polygonArea([])).toBe(0);
    expect(polygonArea([{ x: 0, y: 0 }])).toBe(0);
    expect(polygonArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
  });

  it("pointInPolygon detects inside vs outside", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
  });

  it("formatFeetInches formats correctly across boundaries", () => {
    expect(formatFeetInches(0)).toBe('0"');
    expect(formatFeetInches(11)).toBe('11"');
    expect(formatFeetInches(12)).toBe("1'");
    expect(formatFeetInches(13)).toBe(`1' 1"`);
    expect(formatFeetInches(148)).toBe(`12' 4"`);
  });

  it("polygonSquareFeet converts inches² → ft²", () => {
    // 600" × 360" = 216000 sq in = 1500 sq ft
    const room = [
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 360 },
      { x: 0, y: 360 },
    ];
    expect(polygonSquareFeet(room)).toBe(1500);
  });
});
