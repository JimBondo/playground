"use client";

import { Group, Rect, Arc, Text, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { ArchElement as ArchElementData } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { collides, archElementBox } from "@/lib/collision";
import { EDITOR_COLORS } from "@/lib/constants";

interface ArchElementProps {
  element: ArchElementData;
  pixelsPerInch: number;
  selected: boolean;
}

const TYPE_FILL: Record<ArchElementData["type"], string> = {
  freezerChest: "#0f2b4a",
  wallFridge: "#0f3a55",
  frontCounter: "#3a2b14",
  outlet: "#090014",
  singleDoor: "#1a103c",
  doubleDoor: "#1a103c",
};

export function ArchElementNode({
  element,
  pixelsPerInch,
  selected,
}: ArchElementProps) {
  const updateArchElement = useLayoutStore((s) => s.updateArchElement);
  const setSelection = useLayoutStore((s) => s.setSelection);
  const addToSelection = useLayoutStore((s) => s.addToSelection);
  const archElements = useLayoutStore((s) => s.archElements);
  const shelvingSegments = useLayoutStore((s) => s.shelvingSegments);
  const roomVertices = useLayoutStore((s) => s.room.polygonVertices);

  const widthPx = element.widthInches * pixelsPerInch;
  const depthPx = element.depthInches * pixelsPerInch;

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const state = useLayoutStore.getState();
    const wip = useEditorStore.getState().wireInProgress;
    if (
      state.view.activeMode === "wire" &&
      wip &&
      element.type === "outlet"
    ) {
      // Complete the wire.
      state.addWire({
        startShelfId: wip.startShelfId,
        endOutletId: element.id,
        joints: wip.joints,
      });
      state.updateShelf(wip.startShelfId, {
        powerSource: {
          connectedOutletId: element.id,
          daisyChainedFrom: null,
        },
      });
      useEditorStore.getState().cancelWire();
      state.propagatePower();
      return;
    }
    if (e.evt.shiftKey) {
      addToSelection({ type: "archElement", id: element.id });
    } else {
      setSelection([{ type: "archElement", id: element.id }]);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const proposedX = e.target.x() / pixelsPerInch;
    const proposedY = e.target.y() / pixelsPerInch;
    const box = {
      ...archElementBox({ ...element, x: proposedX, y: proposedY }),
    };
    const check = collides(box, {
      selfId: element.id,
      archElements,
      shelvingSegments,
      roomVertices,
    });
    if (check.collides) {
      // Snap back visually to the last valid position.
      e.target.x(element.x * pixelsPerInch);
      e.target.y(element.y * pixelsPerInch);
      return;
    }
    updateArchElement(element.id, { x: proposedX, y: proposedY });
  };

  const strokeColor = selected ? EDITOR_COLORS.selection : "#ffffff";
  const strokeWidth = selected ? 3 : 1.5;

  return (
    <Group
      x={element.x * pixelsPerInch}
      y={element.y * pixelsPerInch}
      rotation={element.rotation}
      draggable
      onClick={handleClick}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelection([{ type: "archElement", id: element.id }]);
      }}
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
      {element.type === "outlet" ? (
        <>
          <Circle
            radius={widthPx / 2}
            fill={TYPE_FILL.outlet}
            stroke={selected ? EDITOR_COLORS.selection : EDITOR_COLORS.accent}
            strokeWidth={2}
          />
          <Circle
            radius={widthPx / 6}
            fill={EDITOR_COLORS.accent}
            listening={false}
          />
        </>
      ) : (
        <Rect
          x={-widthPx / 2}
          y={-depthPx / 2}
          width={widthPx}
          height={depthPx}
          fill={TYPE_FILL[element.type]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}

      {(element.type === "singleDoor" || element.type === "doubleDoor") && (
        <Arc
          x={-widthPx / 2}
          y={-depthPx / 2}
          innerRadius={0}
          outerRadius={widthPx * (element.type === "doubleDoor" ? 0.5 : 1)}
          angle={90}
          rotation={0}
          stroke={EDITOR_COLORS.selection}
          strokeWidth={1}
          listening={false}
        />
      )}

      {element.type !== "outlet" && (
        <Text
          text={element.type}
          fontSize={10}
          fill="#e0e0e0"
          x={-widthPx / 2 + 4}
          y={-depthPx / 2 + 4}
          listening={false}
        />
      )}
    </Group>
  );
}
