"use client";

import { Group, Rect, Text, Circle, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { ArchElement as ArchElementData } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { collides, archElementBox } from "@/lib/collision";
import { EDITOR_COLORS, ARCH_ELEMENT_DEFAULTS } from "@/lib/constants";

interface ArchElementProps {
  element: ArchElementData;
  pixelsPerInch: number;
  selected: boolean;
}

function isElectrical(type: ArchElementData["type"]): boolean {
  return !!ARCH_ELEMENT_DEFAULTS[type].electrical;
}

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
    if (state.view.activeMode === "wire") {
      // Start: any electrical source that isn't an outlet and has no wire yet.
      if (!wip && isElectrical(element.type) && element.type !== "outlet") {
        useEditorStore.getState().startWire(element.id);
        return;
      }
      // Complete: clicked an outlet while drawing.
      if (wip && element.type === "outlet") {
        state.addWire({
          startElementId: wip.startElementId,
          endOutletId: element.id,
          joints: wip.joints,
        });
        // Mark the source as directly powered (shelves only today).
        const srcShelf = state.shelvingSegments.find(
          (s) => s.id === wip.startElementId,
        );
        if (srcShelf) {
          state.updateShelf(srcShelf.id, {
            powerSource: {
              connectedOutletId: element.id,
              daisyChainedFrom: null,
            },
          });
        }
        useEditorStore.getState().cancelWire();
        state.propagatePower();
        return;
      }
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
      e.target.x(element.x * pixelsPerInch);
      e.target.y(element.y * pixelsPerInch);
      return;
    }
    updateArchElement(element.id, { x: proposedX, y: proposedY });
  };

  const strokeSelected = EDITOR_COLORS.accent;
  const label = ARCH_ELEMENT_DEFAULTS[element.type].label;

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
        <OutletSymbol size={widthPx} selected={selected} />
      ) : element.type === "singleDoor" ? (
        <DoorSymbol
          widthPx={widthPx}
          hingeSide={element.hingeSide ?? "left"}
          swing={element.swingDirection ?? "inward"}
          selected={selected}
        />
      ) : element.type === "doubleDoor" ? (
        <DoubleDoorSymbol
          widthPx={widthPx}
          swing={element.swingDirection ?? "inward"}
          selected={selected}
        />
      ) : element.type === "wallFridge" ? (
        <WallFridgeSymbol
          widthPx={widthPx}
          depthPx={depthPx}
          hingeSide={element.hingeSide ?? "left"}
          swing={element.swingDirection ?? "outward"}
          selected={selected}
          label={label}
          rotationDeg={element.rotation}
        />
      ) : element.type === "freezerChest" ? (
        <FreezerChestSymbol
          widthPx={widthPx}
          depthPx={depthPx}
          selected={selected}
          label={label}
          rotationDeg={element.rotation}
        />
      ) : (
        <FrontCounterSymbol
          widthPx={widthPx}
          depthPx={depthPx}
          selected={selected}
          label={label}
          rotationDeg={element.rotation}
        />
      )}

      {/* Universal selection ring drawn on top so it's always visible */}
      {selected && element.type !== "outlet" ? (
        <Rect
          x={-widthPx / 2 - 2}
          y={-depthPx / 2 - 2}
          width={widthPx + 4}
          height={depthPx + 4}
          stroke={strokeSelected}
          strokeWidth={2}
          dash={[4, 3]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

/** Duplex receptacle: outer rounded box, two vertical slots, ground hole. */
function OutletSymbol({ size, selected }: { size: number; selected: boolean }) {
  const r = Math.max(6, size / 2);
  const slotH = r * 0.9;
  const slotW = Math.max(1, r * 0.18);
  return (
    <Group>
      <Circle
        radius={r}
        fill={EDITOR_COLORS.outlet.fill}
        stroke={selected ? EDITOR_COLORS.accent : EDITOR_COLORS.outlet.stroke}
        strokeWidth={selected ? 2 : 1.5}
      />
      <Rect
        x={-r * 0.45}
        y={-slotH / 2}
        width={slotW}
        height={slotH}
        fill={EDITOR_COLORS.outlet.stroke}
      />
      <Rect
        x={r * 0.45 - slotW}
        y={-slotH / 2}
        width={slotW}
        height={slotH}
        fill={EDITOR_COLORS.outlet.stroke}
      />
      <Circle y={r * 0.35} radius={r * 0.12} fill={EDITOR_COLORS.outlet.stroke} />
    </Group>
  );
}

/** Draws a 90° door swing arc using a polyline so orientation is unambiguous. */
function arcPoints(
  hingeX: number,
  hingeY: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  segments = 14,
): number[] {
  const pts: number[] = [];
  const start = (startAngleDeg * Math.PI) / 180;
  const end = (endAngleDeg * Math.PI) / 180;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = start + (end - start) * t;
    pts.push(hingeX + radius * Math.cos(a), hingeY + radius * Math.sin(a));
  }
  return pts;
}

/**
 * In the local frame of an arch element, the wall sits along y=0 and the room
 * interior is conventionally +y (below in Y-down screen coords). We draw:
 *   • the door leaf in its OPEN (90°) position, perpendicular to the wall
 *   • a dashed quarter-arc showing the swing from closed → open
 *
 * Inward ⇒ leaf rotates into +y. Outward ⇒ leaf rotates into -y.
 */
function DoorSymbol({
  widthPx,
  hingeSide,
  swing,
  selected,
}: {
  widthPx: number;
  hingeSide: "left" | "right";
  swing: "inward" | "outward";
  selected: boolean;
}) {
  const hingeX = hingeSide === "left" ? -widthPx / 2 : widthPx / 2;
  const dir = swing === "inward" ? 1 : -1; // +y inward, -y outward
  const leafTipY = dir * widthPx;
  // Arc: from the closed-tip position (along wall) to the open-tip position.
  // left hinge inward: 0° (+x) → 90° (+y)
  // left hinge outward: 0° (+x) → -90° (-y)
  // right hinge inward: 180° (-x) → 90° (+y)   [decreasing]
  // right hinge outward: 180° (-x) → -90°/270° (-y)
  const startAngle = hingeSide === "left" ? 0 : 180;
  const endAngle = hingeSide === "left" ? dir * 90 : 90 * dir;
  const color = selected ? EDITOR_COLORS.accent : EDITOR_COLORS.door.stroke;
  return (
    <Group>
      {/* Leaf in open position */}
      <Line
        points={[hingeX, 0, hingeX, leafTipY]}
        stroke={color}
        strokeWidth={2}
      />
      {/* Dashed swing arc */}
      <Line
        points={arcPoints(hingeX, 0, widthPx, startAngle, endAngle)}
        stroke={color}
        strokeWidth={1}
        dash={[4, 3]}
      />
      {/* Opening gap in wall — a slim light rect so the wall stroke reads as a break */}
      <Rect
        x={-widthPx / 2}
        y={-1.5}
        width={widthPx}
        height={3}
        fill={EDITOR_COLORS.canvasBg}
      />
    </Group>
  );
}

function DoubleDoorSymbol({
  widthPx,
  swing,
  selected,
}: {
  widthPx: number;
  swing: "inward" | "outward";
  selected: boolean;
}) {
  const half = widthPx / 2;
  const dir = swing === "inward" ? 1 : -1;
  const color = selected ? EDITOR_COLORS.accent : EDITOR_COLORS.door.stroke;
  const leftHingeX = -widthPx / 2;
  const rightHingeX = widthPx / 2;
  return (
    <Group>
      {/* Opening gap */}
      <Rect
        x={-widthPx / 2}
        y={-1.5}
        width={widthPx}
        height={3}
        fill={EDITOR_COLORS.canvasBg}
      />
      {/* Left leaf */}
      <Line
        points={[leftHingeX, 0, leftHingeX, dir * half]}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        points={arcPoints(leftHingeX, 0, half, 0, dir * 90)}
        stroke={color}
        strokeWidth={1}
        dash={[4, 3]}
      />
      {/* Right leaf */}
      <Line
        points={[rightHingeX, 0, rightHingeX, dir * half]}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        points={arcPoints(rightHingeX, 0, half, 180, 90 * dir)}
        stroke={color}
        strokeWidth={1}
        dash={[4, 3]}
      />
    </Group>
  );
}

/** Wall fridge — box + dashed door-swing arc off the front face. */
function WallFridgeSymbol({
  widthPx,
  depthPx,
  hingeSide,
  swing,
  selected,
  label,
  rotationDeg,
}: {
  widthPx: number;
  depthPx: number;
  hingeSide: "left" | "right";
  swing: "inward" | "outward";
  selected: boolean;
  label: string;
  rotationDeg: number;
}) {
  const { fill, stroke } = EDITOR_COLORS.wallFridge;
  const hingeX = hingeSide === "left" ? -widthPx / 2 : widthPx / 2;
  // Door opens from the front face (y = +depthPx/2) into the aisle (+y).
  const swingY = depthPx / 2;
  const dir = swing === "outward" ? 1 : -1; // outward = +y from front face
  const startAngle = hingeSide === "left" ? 0 : 180;
  const endAngle = hingeSide === "left" ? dir * 90 : dir * 90;
  return (
    <Group>
      <Rect
        x={-widthPx / 2}
        y={-depthPx / 2}
        width={widthPx}
        height={depthPx}
        fill={fill}
        stroke={selected ? EDITOR_COLORS.accent : stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <Line
        points={[-widthPx / 2 + 6, 0, widthPx / 2 - 6, 0]}
        stroke={stroke}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Door leaf in open position, perpendicular to front face */}
      <Line
        points={[hingeX, swingY, hingeX, swingY + dir * widthPx]}
        stroke={stroke}
        strokeWidth={2}
      />
      {/* Swing arc */}
      <Line
        points={arcPoints(hingeX, swingY, widthPx, startAngle, endAngle)}
        stroke={stroke}
        strokeWidth={1}
        dash={[4, 3]}
      />
      <LabelText text={label} widthPx={widthPx} depthPx={depthPx} rotationDeg={rotationDeg} />
    </Group>
  );
}

function FreezerChestSymbol({
  widthPx,
  depthPx,
  selected,
  label,
  rotationDeg,
}: {
  widthPx: number;
  depthPx: number;
  selected: boolean;
  label: string;
  rotationDeg: number;
}) {
  const { fill, stroke } = EDITOR_COLORS.freezer;
  return (
    <Group>
      <Rect
        x={-widthPx / 2}
        y={-depthPx / 2}
        width={widthPx}
        height={depthPx}
        fill={fill}
        stroke={selected ? EDITOR_COLORS.accent : stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {/* Cross indicating top-opening lid */}
      <Line
        points={[
          -widthPx / 2,
          -depthPx / 2,
          widthPx / 2,
          depthPx / 2,
        ]}
        stroke={stroke}
        strokeWidth={1}
        opacity={0.5}
      />
      <Line
        points={[
          widthPx / 2,
          -depthPx / 2,
          -widthPx / 2,
          depthPx / 2,
        ]}
        stroke={stroke}
        strokeWidth={1}
        opacity={0.5}
      />
      <LabelText text={label} widthPx={widthPx} depthPx={depthPx} rotationDeg={rotationDeg} />
    </Group>
  );
}

function FrontCounterSymbol({
  widthPx,
  depthPx,
  selected,
  label,
  rotationDeg,
}: {
  widthPx: number;
  depthPx: number;
  selected: boolean;
  label: string;
  rotationDeg: number;
}) {
  const { fill, stroke } = EDITOR_COLORS.frontCounter;
  return (
    <Group>
      <Rect
        x={-widthPx / 2}
        y={-depthPx / 2}
        width={widthPx}
        height={depthPx}
        fill={fill}
        stroke={selected ? EDITOR_COLORS.accent : stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        cornerRadius={2}
      />
      <LabelText text={label} widthPx={widthPx} depthPx={depthPx} rotationDeg={rotationDeg} />
    </Group>
  );
}

/**
 * Label that stays upright regardless of the parent Group's rotation.
 * Konva rotates children with the group, so we counter-rotate around the
 * label's anchor point (element center). Accepts depthPx for symmetry even
 * though it's not currently needed in the layout.
 */
function LabelText({
  text,
  widthPx,
  rotationDeg,
}: {
  text: string;
  widthPx: number;
  depthPx: number;
  rotationDeg: number;
}) {
  const fontSize = Math.max(9, Math.min(12, widthPx / 9));
  return (
    <Text
      text={text}
      fontSize={fontSize}
      fill={EDITOR_COLORS.text}
      x={0}
      y={0}
      offsetX={text.length * fontSize * 0.27}
      offsetY={fontSize / 2}
      rotation={-rotationDeg}
      listening={false}
    />
  );
}

