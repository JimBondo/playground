import { beforeEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "@/store/useLayoutStore";

function reset() {
  useLayoutStore.setState((s) => ({
    ...s,
    archElements: [],
    shelvingSegments: [],
    powerRoutingLines: [],
    selection: [],
  }));
}

function litShelf(overrides: Partial<{ id: string; x: number; y: number }> = {}) {
  return {
    type: "litShelf" as const,
    lengthInches: 48,
    widthInches: 24,
    heightInches: 84,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    rotation: 0,
    powerSource: { connectedOutletId: null, daisyChainedFrom: null },
    snappedConnections: { leftId: null, rightId: null },
  };
}

describe("power propagation", () => {
  beforeEach(reset);

  it("directly-wired shelf stays powered", () => {
    const outletId = useLayoutStore.getState().addArchElement({
      type: "outlet",
      x: 10,
      y: 10,
      rotation: 0,
      widthInches: 4,
      depthInches: 4,
    });
    const shelfId = useLayoutStore.getState().addShelf(litShelf());
    useLayoutStore.getState().addWire({
      startShelfId: shelfId,
      endOutletId: outletId,
      joints: [],
    });
    useLayoutStore.getState().updateShelf(shelfId, {
      powerSource: { connectedOutletId: outletId, daisyChainedFrom: null },
    });
    useLayoutStore.getState().propagatePower();
    const sh = useLayoutStore
      .getState()
      .shelvingSegments.find((s) => s.id === shelfId)!;
    expect(sh.powerSource.connectedOutletId).toBe(outletId);
  });

  it("snap-connected neighbor of a powered shelf becomes daisy-chained", () => {
    const outletId = useLayoutStore.getState().addArchElement({
      type: "outlet",
      x: 10,
      y: 10,
      rotation: 0,
      widthInches: 4,
      depthInches: 4,
    });
    const shelfAId = useLayoutStore.getState().addShelf(litShelf());
    const shelfBId = useLayoutStore
      .getState()
      .addShelf(litShelf({ x: 100 }));
    useLayoutStore.getState().updateShelf(shelfAId, {
      powerSource: { connectedOutletId: outletId, daisyChainedFrom: null },
    });
    useLayoutStore.getState().updateShelf(shelfBId, {
      snappedConnections: { leftId: shelfAId, rightId: null },
    });
    useLayoutStore.getState().updateShelf(shelfAId, {
      snappedConnections: { leftId: null, rightId: shelfBId },
    });
    useLayoutStore.getState().propagatePower();

    const b = useLayoutStore
      .getState()
      .shelvingSegments.find((s) => s.id === shelfBId)!;
    expect(b.powerSource.daisyChainedFrom).toBe(shelfAId);
  });

  it("daisy chain propagates through 3 shelves", () => {
    const outletId = useLayoutStore.getState().addArchElement({
      type: "outlet",
      x: 10,
      y: 10,
      rotation: 0,
      widthInches: 4,
      depthInches: 4,
    });
    const a = useLayoutStore.getState().addShelf(litShelf());
    const b = useLayoutStore.getState().addShelf(litShelf({ x: 100 }));
    const c = useLayoutStore.getState().addShelf(litShelf({ x: 200 }));
    useLayoutStore.getState().updateShelf(a, {
      powerSource: { connectedOutletId: outletId, daisyChainedFrom: null },
      snappedConnections: { leftId: null, rightId: b },
    });
    useLayoutStore.getState().updateShelf(b, {
      snappedConnections: { leftId: a, rightId: c },
    });
    useLayoutStore.getState().updateShelf(c, {
      snappedConnections: { leftId: b, rightId: null },
    });
    useLayoutStore.getState().propagatePower();

    const bState = useLayoutStore
      .getState()
      .shelvingSegments.find((s) => s.id === b)!;
    const cState = useLayoutStore
      .getState()
      .shelvingSegments.find((s) => s.id === c)!;
    expect(bState.powerSource.daisyChainedFrom).toBe(a);
    expect(cState.powerSource.daisyChainedFrom).toBe(b);
  });

  it("disconnecting snap breaks the daisy chain", () => {
    const outletId = useLayoutStore.getState().addArchElement({
      type: "outlet",
      x: 10,
      y: 10,
      rotation: 0,
      widthInches: 4,
      depthInches: 4,
    });
    const a = useLayoutStore.getState().addShelf(litShelf());
    const b = useLayoutStore.getState().addShelf(litShelf({ x: 100 }));
    useLayoutStore.getState().updateShelf(a, {
      powerSource: { connectedOutletId: outletId, daisyChainedFrom: null },
      snappedConnections: { leftId: null, rightId: b },
    });
    useLayoutStore.getState().updateShelf(b, {
      snappedConnections: { leftId: a, rightId: null },
    });
    useLayoutStore.getState().propagatePower();
    expect(
      useLayoutStore
        .getState()
        .shelvingSegments.find((s) => s.id === b)!
        .powerSource.daisyChainedFrom,
    ).toBe(a);

    // Break the snap.
    useLayoutStore.getState().updateShelf(a, {
      snappedConnections: { leftId: null, rightId: null },
    });
    useLayoutStore.getState().updateShelf(b, {
      snappedConnections: { leftId: null, rightId: null },
    });
    useLayoutStore.getState().propagatePower();
    expect(
      useLayoutStore
        .getState()
        .shelvingSegments.find((s) => s.id === b)!
        .powerSource.daisyChainedFrom,
    ).toBeNull();
  });
});
