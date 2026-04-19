"use client";

import { useMemo } from "react";
import { Group, Rect, Line, Circle, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { ShelvingSegment } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { computeSnap, computeAlignmentGuides } from "@/hooks/useSnapEngine";
import { collides, shelfBox } from "@/lib/collision";
import { EDITOR_COLORS, SHELF_DEFAULTS } from "@/lib/constants";

interface ShelfSegmentProps {
  shelf: ShelvingSegment;
  pixelsPerInch: number;
  selected: boolean;
}

const TYPE_FILL: Record<ShelvingSegment["type"], string> = {
  endCap: "#2a1b4e",
  standard: "#1a103c",
  pegBoard: "#120826",
  litShelf: "#2c155a",
  unlitShelf: "#1a103c",
};

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

  const isPowered = useMemo(
    () =>
      !!shelf.powerSource.connectedOutletId ||
      !!shelf.powerSource.daisyChainedFrom,
    [shelf.powerSource],
  );

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
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
    const guides = computeAlignmentGuides(
      { x: snap.x, y: snap.y },
      ctx,
    );
    setAlignmentGuides(guides);
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
    // Visually apply the snap so the drag feels magnetic.
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
    updateShelf(shelf.id, { x: snap.x, y: snap.y, snappedConnections: connections });

    // Update the matched neighbor's opposite side to point back at us.
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
  };

  const isBeingDragged = dragPreview?.id === shelf.id;
  const showCollision = isBeingDragged && dragPreview.colliding;
  const fill = showCollision ? "#4a0a1e" : TYPE_FILL[shelf.type];
  const stroke = selected
    ? EDITOR_COLORS.selection
    : showCollision
      ? EDITOR_COLORS.danger
      : "#ffffff";

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
      <Rect
        x={-lengthPx / 2}
        y={-widthPx / 2}
        width={lengthPx}
        height={widthPx}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 3 : 1.5}
      />

      {/* Lit shelf glow halo */}
      {shelf.type === "litShelf" ? (
        <Rect
          x={-lengthPx / 2 - 6}
          y={-widthPx / 2 - 6}
          width={lengthPx + 12}
          height={widthPx + 12}
          stroke="#ffffee"
          strokeWidth={2}
          opacity={0.35}
          listening={false}
        />
      ) : null}

      {/* Peg board dots */}
      {shelf.type === "pegBoard"
        ? Array.from({ length: 6 }).map((_, i) => (
            <Circle
              key={i}
              x={-lengthPx / 2 + ((i + 1) * lengthPx) / 7}
              y={0}
              radius={Math.min(2, widthPx / 8)}
              fill="#ff00ff"
              opacity={0.7}
              listening={false}
            />
          ))
        : null}

      <Text
        text={SHELF_DEFAULTS[shelf.type].label}
        fontSize={10}
        fill="#e0e0e0"
        x={-lengthPx / 2 + 4}
        y={-widthPx / 2 + 4}
        listening={false}
      />

      {/* Power indicator */}
      {shelf.type === "litShelf" ? (
        <Circle
          x={lengthPx / 2 - 6}
          y={-widthPx / 2 + 6}
          radius={4}
          fill={isPowered ? "#33ff88" : "#ffaa33"}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
