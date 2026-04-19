"use client";

import { useMemo } from "react";
import { Group, Rect, Line, Circle, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { ShelvingSegment } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { computeSnap, computeAlignmentGuides } from "@/hooks/useSnapEngine";
import { collides } from "@/lib/collision";
import { EDITOR_COLORS, SHELF_DEFAULTS } from "@/lib/constants";

interface ShelfSegmentProps {
  shelf: ShelvingSegment;
  pixelsPerInch: number;
  selected: boolean;
}

function paletteFor(type: ShelvingSegment["type"]) {
  switch (type) {
    case "endCap":
      return EDITOR_COLORS.shelfEndCap;
    case "pegBoard":
      return EDITOR_COLORS.shelfPegBoard;
    case "litShelf":
      return EDITOR_COLORS.shelfLit;
    case "unlitShelf":
    case "standard":
    default:
      return EDITOR_COLORS.shelf;
  }
}

export function ShelfSegmentNode({
  shelf,
  pixelsPerInch,
  selected,
}: ShelfSegmentProps) {
  const updateShelf = useLayoutStore((s) => s.updateShelf);
  const setSelection = useLayoutStore((s) => s.setSelection);
  const addToSelection = useLayoutStore((s) => s.addToSelection);
  const dragPreview = useEditorStore((s) => s.dragPreview);
  const setDragPreview = useEditorStore((s) => s.setDragPreview);
  const setAlignmentGuides = useEditorStore((s) => s.setAlignmentGuides);
  const shiftHeld = useEditorStore((s) => s.shiftHeld);

  const lengthPx = shelf.lengthInches * pixelsPerInch;
  const widthPx = shelf.widthInches * pixelsPerInch;
  const palette = paletteFor(shelf.type);

  const isPowered = useMemo(
    () =>
      !!shelf.powerSource.connectedOutletId ||
      !!shelf.powerSource.daisyChainedFrom,
    [shelf.powerSource],
  );

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const activeMode = useLayoutStore.getState().view.activeMode;
    if (activeMode === "wire" && shelf.type === "litShelf") {
      useEditorStore.getState().startWire(shelf.id);
      return;
    }
    if (e.evt.shiftKey) {
      addToSelection({ type: "shelf", id: shelf.id });
    } else {
      setSelection([{ type: "shelf", id: shelf.id }]);
    }
  };

  const buildSnapCtx = () => {
    const state = useLayoutStore.getState();
    const basePPI = state.view.basePixelsPerInch;
    return {
      selfId: shelf.id,
      widthInches: shelf.lengthInches,
      heightInches: shelf.widthInches,
      rotationDeg: shelf.rotation,
      archElements: state.archElements,
      shelvingSegments: state.shelvingSegments,
      roomVertices: state.room.polygonVertices,
      pixelsPerInch: basePPI * state.view.zoom,
      gridSpacingInches: state.view.gridSpacingInches,
      snapToGridActive: state.view.snapToGrid || shiftHeld,
    };
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const proposedX = e.target.x() / pixelsPerInch;
    const proposedY = e.target.y() / pixelsPerInch;
    const ctx = buildSnapCtx();
    const snap = computeSnap({ x: proposedX, y: proposedY }, ctx);
    setAlignmentGuides(computeAlignmentGuides({ x: snap.x, y: snap.y }, ctx));
    const box = {
      x: snap.x,
      y: snap.y,
      width: shelf.lengthInches,
      height: shelf.widthInches,
      rotation: shelf.rotation,
    };
    const coll = collides(box, {
      selfId: shelf.id,
      archElements: ctx.archElements,
      shelvingSegments: ctx.shelvingSegments,
      roomVertices: ctx.roomVertices,
    });
    setDragPreview({
      id: shelf.id,
      kind: "shelf",
      x: snap.x,
      y: snap.y,
      width: shelf.lengthInches,
      height: shelf.widthInches,
      rotation: shelf.rotation,
      colliding: coll.collides,
    });
    e.target.x(snap.x * pixelsPerInch);
    e.target.y(snap.y * pixelsPerInch);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const proposedX = e.target.x() / pixelsPerInch;
    const proposedY = e.target.y() / pixelsPerInch;
    const ctx = buildSnapCtx();
    const snap = computeSnap({ x: proposedX, y: proposedY }, ctx);
    setAlignmentGuides([]);
    setDragPreview(null);

    const box = {
      x: snap.x,
      y: snap.y,
      width: shelf.lengthInches,
      height: shelf.widthInches,
      rotation: shelf.rotation,
    };
    const coll = collides(box, {
      selfId: shelf.id,
      archElements: ctx.archElements,
      shelvingSegments: ctx.shelvingSegments,
      roomVertices: ctx.roomVertices,
    });
    if (coll.collides) {
      e.target.x(shelf.x * pixelsPerInch);
      e.target.y(shelf.y * pixelsPerInch);
      return;
    }
    const connections = {
      leftId: snap.leftNeighborId,
      rightId: snap.rightNeighborId,
    };

    // Clear stale neighbor references pointing at us.
    const storeBefore = useLayoutStore.getState();
    for (const other of storeBefore.shelvingSegments) {
      if (other.id === shelf.id) continue;
      const patch: Partial<ShelvingSegment["snappedConnections"]> = {};
      if (other.snappedConnections.leftId === shelf.id) patch.leftId = null;
      if (other.snappedConnections.rightId === shelf.id) patch.rightId = null;
      if (Object.keys(patch).length > 0) {
        storeBefore.updateShelf(other.id, {
          snappedConnections: { ...other.snappedConnections, ...patch },
        });
      }
    }

    updateShelf(shelf.id, {
      x: snap.x,
      y: snap.y,
      snappedConnections: connections,
    });

    const storeNow = useLayoutStore.getState();
    if (snap.leftNeighborId) {
      const neighbor = storeNow.shelvingSegments.find(
        (s) => s.id === snap.leftNeighborId,
      );
      if (neighbor) {
        storeNow.updateShelf(neighbor.id, {
          snappedConnections: {
            ...neighbor.snappedConnections,
            rightId: shelf.id,
          },
        });
      }
    }
    if (snap.rightNeighborId) {
      const neighbor = storeNow.shelvingSegments.find(
        (s) => s.id === snap.rightNeighborId,
      );
      if (neighbor) {
        storeNow.updateShelf(neighbor.id, {
          snappedConnections: {
            ...neighbor.snappedConnections,
            leftId: shelf.id,
          },
        });
      }
    }

    useLayoutStore.getState().propagatePower();
  };

  const isBeingDragged = dragPreview?.id === shelf.id;
  const showCollision = isBeingDragged && dragPreview.colliding;
  const fill = showCollision ? "#fee2e2" : palette.fill;
  const stroke = selected
    ? EDITOR_COLORS.accent
    : showCollision
      ? EDITOR_COLORS.danger
      : palette.stroke;

  return (
    <Group
      x={shelf.x * pixelsPerInch}
      y={shelf.y * pixelsPerInch}
      rotation={shelf.rotation}
      draggable
      onClick={handleClick}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelection([{ type: "shelf", id: shelf.id }]);
      }}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "grab";
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
    >
      {shelf.type === "litShelf" ? (
        <Rect
          x={-lengthPx / 2 - 4}
          y={-widthPx / 2 - 4}
          width={lengthPx + 8}
          height={widthPx + 8}
          fill={EDITOR_COLORS.shelfLit.halo}
          listening={false}
        />
      ) : null}

      <Rect
        x={-lengthPx / 2}
        y={-widthPx / 2}
        width={lengthPx}
        height={widthPx}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Internal shelf lines to make "shelf" legible at a glance. */}
      {shelf.type !== "pegBoard" ? (
        <>
          <Line
            points={[-lengthPx / 2 + 4, 0, lengthPx / 2 - 4, 0]}
            stroke={palette.stroke}
            strokeWidth={1}
            opacity={0.45}
          />
          <Line
            points={[-lengthPx / 2 + 4, -widthPx / 4, lengthPx / 2 - 4, -widthPx / 4]}
            stroke={palette.stroke}
            strokeWidth={1}
            opacity={0.3}
          />
          <Line
            points={[-lengthPx / 2 + 4, widthPx / 4, lengthPx / 2 - 4, widthPx / 4]}
            stroke={palette.stroke}
            strokeWidth={1}
            opacity={0.3}
          />
        </>
      ) : null}

      {shelf.type === "pegBoard"
        ? Array.from({ length: 12 }).map((_, col) =>
            Array.from({ length: 3 }).map((_, row) => (
              <Circle
                key={`${col}-${row}`}
                x={-lengthPx / 2 + ((col + 0.5) / 12) * lengthPx}
                y={-widthPx / 2 + ((row + 0.5) / 3) * widthPx}
                radius={Math.max(1, widthPx / 20)}
                fill={palette.stroke}
                opacity={0.55}
                listening={false}
              />
            )),
          )
        : null}

      <Text
        text={SHELF_DEFAULTS[shelf.type].label}
        fontSize={Math.max(9, Math.min(12, lengthPx / 8))}
        fill={EDITOR_COLORS.text}
        x={-lengthPx / 2 + 4}
        y={-widthPx / 2 + 4}
        listening={false}
      />

      {shelf.type === "litShelf" ? (
        <Circle
          x={lengthPx / 2 - 6}
          y={-widthPx / 2 + 6}
          radius={4}
          fill={isPowered ? EDITOR_COLORS.powered : EDITOR_COLORS.unpowered}
          stroke="#ffffff"
          strokeWidth={1}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
