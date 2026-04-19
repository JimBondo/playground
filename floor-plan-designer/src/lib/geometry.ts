import type { Point } from "@/types";

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Shoelace formula — returns unsigned area in the same units² as the input. */
export function polygonArea(vertices: Point[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    sum += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
  }
  return Math.abs(sum) / 2;
}

/** Ray-casting point-in-polygon (assumes closed polygon). */
export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Convert a raw inches value to a human-readable `X' Y"` string. */
export function formatFeetInches(inches: number): string {
  const total = Math.round(inches);
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  if (ft === 0) return `${inch}"`;
  if (inch === 0) return `${ft}'`;
  return `${ft}' ${inch}"`;
}

export function inchesToPixels(inches: number, pixelsPerInch: number): number {
  return inches * pixelsPerInch;
}

export function pixelsToInches(pixels: number, pixelsPerInch: number): number {
  return pixels / pixelsPerInch;
}

/** Sq ft from a polygon whose vertices are in inches. */
export function polygonSquareFeet(vertices: Point[]): number {
  const areaSqIn = polygonArea(vertices);
  return areaSqIn / 144;
}
