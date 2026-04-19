"use client";

import { Group, Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { PowerRoutingLine, ArchElement, ShelvingSegment } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { EDITOR_COLORS } from "@/lib/constants";

interface WireRouteProps {
  wire: PowerRoutingLine;
  pixelsPerInch: number;
}

function centerOf(
  startElementId: string,
  shelves: ShelvingSegment[],
  arch: ArchElement[],
): { x: number; y: number } | null {
  const s = shelves.find((x) => x.id === startElementId);
  if (s) return { x: s.x, y: s.y };
  const a = arch.find((x) => x.id === startElementId);
  if (a) return { x: a.x, y: a.y };
  return null;
}

export function WireRoute({ wire, pixelsPerInch }: WireRouteProps) {
  const updateWireJoint = useLayoutStore((s) => s.updateWireJoint);
  const removeWire = useLayoutStore((s) => s.removeWire);
  const shelves = useLayoutStore((s) => s.shelvingSegments);
  const arch = useLayoutStore((s) => s.archElements);

  const start = centerOf(wire.startElementId, shelves, arch);
  const end = arch.find((a) => a.id === wire.endOutletId);
  if (!start || !end) return null;

  const points = [
    start.x * pixelsPerInch,
    start.y * pixelsPerInch,
    ...wire.joints.flatMap((j) => [j.x * pixelsPerInch, j.y * pixelsPerInch]),
    end.x * pixelsPerInch,
    end.y * pixelsPerInch,
  ];

  const onJointDragEnd = (index: number) => (e: KonvaEventObject<DragEvent>) => {
    updateWireJoint(wire.id, index, {
      x: e.target.x() / pixelsPerInch,
      y: e.target.y() / pixelsPerInch,
    });
  };

  return (
    <Group>
      <Line
        points={points}
        stroke={EDITOR_COLORS.wire}
        strokeWidth={2}
        lineJoin="round"
        lineCap="round"
        listening={false}
      />
      {wire.joints.map((j, i) => (
        <Circle
          key={i}
          x={j.x * pixelsPerInch}
          y={j.y * pixelsPerInch}
          radius={5}
          fill={EDITOR_COLORS.wireJoint}
          stroke="#ffffff"
          strokeWidth={1.5}
          draggable
          onDragEnd={onJointDragEnd(i)}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            removeWire(wire.id);
          }}
        />
      ))}
    </Group>
  );
}

interface WireInProgressPreviewProps {
  pixelsPerInch: number;
}

export function WireInProgressPreview({
  pixelsPerInch,
}: WireInProgressPreviewProps) {
  const shelves = useLayoutStore((s) => s.shelvingSegments);
  const arch = useLayoutStore((s) => s.archElements);
  const wip = useEditorStore((s) => s.wireInProgress);
  if (!wip) return null;
  const start = centerOf(wip.startElementId, shelves, arch);
  if (!start) return null;

  const pts: number[] = [start.x * pixelsPerInch, start.y * pixelsPerInch];
  for (const j of wip.joints) {
    pts.push(j.x * pixelsPerInch, j.y * pixelsPerInch);
  }
  if (wip.cursor) {
    pts.push(wip.cursor.x * pixelsPerInch, wip.cursor.y * pixelsPerInch);
  }

  return (
    <Line
      points={pts}
      stroke={EDITOR_COLORS.wire}
      strokeWidth={2}
      dash={[8, 4]}
      opacity={0.9}
      listening={false}
    />
  );
}
