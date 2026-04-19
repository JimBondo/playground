import { beforeEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "@/store/useLayoutStore";
import { DEFAULT_ROOM, DEFAULT_VIEW, SHELF_DEFAULTS } from "@/lib/constants";

function resetStore() {
  useLayoutStore.setState((s) => ({
    ...s,
    archElements: [],
    shelvingSegments: [],
    powerRoutingLines: [],
    selection: [],
    room: {
      polygonVertices: DEFAULT_ROOM.polygonVertices.map((v) => ({ ...v })),
      wallThicknessInches: DEFAULT_ROOM.wallThicknessInches,
    },
    view: { ...DEFAULT_VIEW },
  }));
}

function sampleShelf() {
  return {
    type: "standard" as const,
    lengthInches: SHELF_DEFAULTS.standard.lengthInches,
    widthInches: SHELF_DEFAULTS.standard.widthInches,
    heightInches: SHELF_DEFAULTS.standard.heightInches,
    x: 100,
    y: 100,
    rotation: 0,
    powerSource: { connectedOutletId: null, daisyChainedFrom: null },
    snappedConnections: { leftId: null, rightId: null },
  };
}

function sampleOutlet() {
  return {
    type: "outlet" as const,
    x: 50,
    y: 50,
    rotation: 0,
    widthInches: 4,
    depthInches: 4,
  };
}

describe("useLayoutStore — initial state", () => {
  beforeEach(resetStore);

  it("ships with the default rectangular room", () => {
    const state = useLayoutStore.getState();
    expect(state.room.polygonVertices).toHaveLength(4);
    expect(state.room.wallThicknessInches).toBe(6);
  });

  it("reports 1500 sq ft for the default 50×30 room", () => {
    expect(useLayoutStore.getState().getRoomAreaSqFt()).toBe(1500);
  });

  it("starts with empty entity lists and no selection", () => {
    const s = useLayoutStore.getState();
    expect(s.archElements).toEqual([]);
    expect(s.shelvingSegments).toEqual([]);
    expect(s.powerRoutingLines).toEqual([]);
    expect(s.selection).toEqual([]);
  });
});

describe("useLayoutStore — shelves", () => {
  beforeEach(resetStore);

  it("adds, updates, and removes a shelf", () => {
    const id = useLayoutStore.getState().addShelf(sampleShelf());
    expect(useLayoutStore.getState().shelvingSegments).toHaveLength(1);

    useLayoutStore.getState().updateShelf(id, { x: 500, rotation: 90 });
    const updated = useLayoutStore.getState().shelvingSegments[0];
    expect(updated.x).toBe(500);
    expect(updated.rotation).toBe(90);

    useLayoutStore.getState().removeShelf(id);
    expect(useLayoutStore.getState().shelvingSegments).toHaveLength(0);
  });

  it("duplicate offsets the copy by lengthInches", () => {
    const id = useLayoutStore.getState().addShelf(sampleShelf());
    const copyId = useLayoutStore.getState().duplicateShelf(id);
    expect(copyId).not.toBeNull();
    const copies = useLayoutStore
      .getState()
      .shelvingSegments.filter((s) => s.id === copyId);
    expect(copies).toHaveLength(1);
    expect(copies[0].x).toBe(100 + SHELF_DEFAULTS.standard.lengthInches);
  });

  it("rotate cycles through 90° increments and wraps", () => {
    const id = useLayoutStore.getState().addShelf(sampleShelf());
    for (let i = 0; i < 4; i++) useLayoutStore.getState().rotateShelf(id);
    expect(useLayoutStore.getState().shelvingSegments[0].rotation).toBe(0);
  });

  it("removing a shelf clears references on neighbors", () => {
    const a = useLayoutStore.getState().addShelf(sampleShelf());
    const b = useLayoutStore.getState().addShelf(sampleShelf());
    useLayoutStore.getState().updateShelf(b, {
      snappedConnections: { leftId: a, rightId: null },
      powerSource: { connectedOutletId: null, daisyChainedFrom: a },
    });
    useLayoutStore.getState().removeShelf(a);
    const remaining = useLayoutStore.getState().shelvingSegments[0];
    expect(remaining.snappedConnections.leftId).toBeNull();
    expect(remaining.powerSource.daisyChainedFrom).toBeNull();
  });
});

describe("useLayoutStore — architectural elements", () => {
  beforeEach(resetStore);

  it("adds, updates, and removes", () => {
    const id = useLayoutStore.getState().addArchElement(sampleOutlet());
    expect(useLayoutStore.getState().archElements).toHaveLength(1);
    useLayoutStore.getState().updateArchElement(id, { x: 999 });
    expect(useLayoutStore.getState().archElements[0].x).toBe(999);
    useLayoutStore.getState().removeArchElement(id);
    expect(useLayoutStore.getState().archElements).toHaveLength(0);
  });
});

describe("useLayoutStore — serialization", () => {
  beforeEach(resetStore);

  it("exportState → importState is a round-trip", () => {
    const shelfId = useLayoutStore.getState().addShelf(sampleShelf());
    const outletId = useLayoutStore.getState().addArchElement(sampleOutlet());
    const snapshot = useLayoutStore.getState().exportState();

    resetStore();
    expect(useLayoutStore.getState().shelvingSegments).toHaveLength(0);

    const result = useLayoutStore.getState().importState(snapshot);
    expect(result.success).toBe(true);
    const after = useLayoutStore.getState();
    expect(after.shelvingSegments.map((s) => s.id)).toContain(shelfId);
    expect(after.archElements.map((e) => e.id)).toContain(outletId);
  });

  it("exportState excludes transient view fields", () => {
    useLayoutStore.getState().setZoom(2.5);
    useLayoutStore.getState().setPan(123, 456);
    useLayoutStore.getState().setActiveMode("wire");
    const snapshot = JSON.parse(useLayoutStore.getState().exportState());
    expect(snapshot.view.zoom).toBeUndefined();
    expect(snapshot.view.panX).toBeUndefined();
    expect(snapshot.view.activeMode).toBeUndefined();
    // But persisted user-prefs should remain:
    expect(snapshot.view.showGrid).toBe(true);
    expect(snapshot.view.basePixelsPerInch).toBe(4);
  });

  it("importState rejects malformed payloads", () => {
    const bad1 = useLayoutStore.getState().importState("not json at all");
    const bad2 = useLayoutStore.getState().importState('{"nope": true}');
    expect(bad1.success).toBe(false);
    expect(bad2.success).toBe(false);
  });
});

describe("useLayoutStore — room vertices", () => {
  beforeEach(resetStore);

  it("updateVertex moves a single point", () => {
    useLayoutStore.getState().updateVertex(0, { x: -50, y: -50 });
    expect(useLayoutStore.getState().room.polygonVertices[0]).toEqual({
      x: -50,
      y: -50,
    });
  });

  it("addVertex inserts after the given index", () => {
    useLayoutStore.getState().addVertex(0, { x: 300, y: 0 });
    const verts = useLayoutStore.getState().room.polygonVertices;
    expect(verts).toHaveLength(5);
    expect(verts[1]).toEqual({ x: 300, y: 0 });
  });

  it("removeVertex refuses to drop below 3 vertices", () => {
    const { removeVertex } = useLayoutStore.getState();
    removeVertex(0);
    expect(useLayoutStore.getState().room.polygonVertices).toHaveLength(3);
    removeVertex(0);
    expect(useLayoutStore.getState().room.polygonVertices).toHaveLength(3);
  });
});

describe("useLayoutStore — templates", () => {
  beforeEach(resetStore);

  it("loadTemplate replaces room + seeds arch elements", () => {
    useLayoutStore.getState().loadTemplate("convenience-store");
    const s = useLayoutStore.getState();
    expect(s.room.polygonVertices).toHaveLength(4);
    expect(s.archElements.length).toBeGreaterThan(0);
    // All seeded elements must have an id.
    for (const e of s.archElements) {
      expect(typeof e.id).toBe("string");
      expect(e.id.length).toBeGreaterThan(0);
    }
    expect(s.project.name).toBe("Convenience Store");
  });

  it("loadTemplate clears existing content", () => {
    useLayoutStore.getState().addShelf({
      type: "standard",
      lengthInches: 48,
      widthInches: 24,
      heightInches: 84,
      x: 0,
      y: 0,
      rotation: 0,
      powerSource: { connectedOutletId: null, daisyChainedFrom: null },
      snappedConnections: { leftId: null, rightId: null },
    });
    useLayoutStore.getState().loadTemplate("blank-rect");
    expect(useLayoutStore.getState().shelvingSegments).toHaveLength(0);
  });
});

describe("useLayoutStore — view toggles", () => {
  beforeEach(resetStore);

  it("setZoom clamps to 0.25–4", () => {
    useLayoutStore.getState().setZoom(0.1);
    expect(useLayoutStore.getState().view.zoom).toBe(0.25);
    useLayoutStore.getState().setZoom(99);
    expect(useLayoutStore.getState().view.zoom).toBe(4);
  });

  it("toggleGrid flips the flag", () => {
    const before = useLayoutStore.getState().view.showGrid;
    useLayoutStore.getState().toggleGrid();
    expect(useLayoutStore.getState().view.showGrid).toBe(!before);
  });
});
