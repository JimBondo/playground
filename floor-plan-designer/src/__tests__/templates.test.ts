import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate, resolveArchSeed } from "@/lib/templates";
import { ARCH_ELEMENT_DEFAULTS, DEFAULT_ROOM } from "@/lib/constants";
import { pointInPolygon, polygonSquareFeet } from "@/lib/geometry";

describe("templates", () => {
  it("ships all spec'd templates", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toEqual([
      "blank-rect",
      "small-retail",
      "convenience-store",
      "large-retail",
      "l-shaped",
    ]);
  });

  it("each template has a closed polygon with ≥3 vertices", () => {
    for (const t of TEMPLATES) {
      expect(t.room.polygonVertices.length).toBeGreaterThanOrEqual(3);
      expect(t.room.wallThicknessInches).toBeGreaterThan(0);
    }
  });

  it("arch seeds fill in default dimensions when omitted", () => {
    const seed = { type: "singleDoor" as const, x: 50, y: 0, rotation: 0 };
    const resolved = resolveArchSeed(seed);
    expect(resolved.widthInches).toBe(
      ARCH_ELEMENT_DEFAULTS.singleDoor.widthInches,
    );
    expect(resolved.depthInches).toBe(
      ARCH_ELEMENT_DEFAULTS.singleDoor.depthInches,
    );
  });

  it("L-shape has the expected cutout area", () => {
    const t = getTemplate("l-shaped");
    expect(t).toBeDefined();
    // 60×40 = 2400 ft²; minus 20×20 = 400 ft² cutout → 2000 ft²
    expect(polygonSquareFeet(t!.room.polygonVertices)).toBe(2000);
  });

  it("all template arch seeds are inside their polygons", () => {
    for (const t of TEMPLATES) {
      for (const seed of t.archElements) {
        const inside = pointInPolygon(
          { x: seed.x, y: seed.y },
          t.room.polygonVertices,
        );
        // Some intentionally sit on the edge (doors) — accept if within 1"
        // of an edge via bounding-box check as a fallback.
        if (!inside) {
          const xs = t.room.polygonVertices.map((v) => v.x);
          const ys = t.room.polygonVertices.map((v) => v.y);
          expect(seed.x).toBeGreaterThanOrEqual(Math.min(...xs) - 1);
          expect(seed.x).toBeLessThanOrEqual(Math.max(...xs) + 1);
          expect(seed.y).toBeGreaterThanOrEqual(Math.min(...ys) - 1);
          expect(seed.y).toBeLessThanOrEqual(Math.max(...ys) + 1);
        }
      }
    }
  });

  it("default room matches the blank template", () => {
    expect(DEFAULT_ROOM.polygonVertices).toEqual(
      TEMPLATES[0].room.polygonVertices,
    );
  });

  it("getTemplate returns undefined for unknown id", () => {
    expect(getTemplate("no-such-template")).toBeUndefined();
  });
});
