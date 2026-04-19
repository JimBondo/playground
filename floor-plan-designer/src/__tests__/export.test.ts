import { describe, expect, it } from "vitest";
import { buildBom, exportProjectJson } from "@/lib/export";
import { DEFAULT_ROOM, DEFAULT_VIEW } from "@/lib/constants";
import type { ArchElement, ShelvingSegment } from "@/types";

describe("buildBom", () => {
  it("groups by element type with correct quantities", () => {
    const arch: ArchElement[] = [
      {
        id: "1",
        type: "outlet",
        x: 0,
        y: 0,
        rotation: 0,
        widthInches: 4,
        depthInches: 4,
      },
      {
        id: "2",
        type: "outlet",
        x: 0,
        y: 0,
        rotation: 0,
        widthInches: 4,
        depthInches: 4,
      },
      {
        id: "3",
        type: "singleDoor",
        x: 0,
        y: 0,
        rotation: 0,
        widthInches: 36,
        depthInches: 6,
      },
    ];
    const shelves: ShelvingSegment[] = [
      {
        id: "s1",
        type: "standard",
        lengthInches: 48,
        widthInches: 24,
        heightInches: 84,
        x: 0,
        y: 0,
        rotation: 0,
        powerSource: { connectedOutletId: null, daisyChainedFrom: null },
        snappedConnections: { leftId: null, rightId: null },
      },
      {
        id: "s2",
        type: "litShelf",
        lengthInches: 48,
        widthInches: 24,
        heightInches: 84,
        x: 0,
        y: 0,
        rotation: 0,
        powerSource: { connectedOutletId: null, daisyChainedFrom: null },
        snappedConnections: { leftId: null, rightId: null },
      },
    ];
    const rows = buildBom(arch, shelves);
    const outletRow = rows.find((r) => r.type === "Outlet");
    expect(outletRow?.quantity).toBe(2);
    const doorRow = rows.find((r) => r.type === "Single Door");
    expect(doorRow?.quantity).toBe(1);
    const litRow = rows.find((r) => r.type === "Lit Shelf");
    expect(litRow?.lit).toBe("Y");
    const stdRow = rows.find((r) => r.type === "Standard");
    expect(stdRow?.lit).toBe("N");
  });
});

describe("exportProjectJson", () => {
  it("emits a valid, reimportable snapshot", () => {
    const state = {
      project: {
        id: "p1",
        name: "Test",
        createdAt: "2026-01-01",
        lastModified: "2026-01-01",
      },
      view: { ...DEFAULT_VIEW, zoom: 1.5, panX: 100 },
      room: DEFAULT_ROOM,
      archElements: [],
      shelvingSegments: [],
      powerRoutingLines: [],
      selection: [],
    };
    const json = exportProjectJson(state);
    const parsed = JSON.parse(json);
    // Persisted view fields:
    expect(parsed.view.basePixelsPerInch).toBe(DEFAULT_VIEW.basePixelsPerInch);
    expect(parsed.view.showGrid).toBe(true);
    // Transient fields excluded:
    expect(parsed.view.zoom).toBeUndefined();
    expect(parsed.view.panX).toBeUndefined();
    expect(parsed.view.activeMode).toBeUndefined();
  });
});
