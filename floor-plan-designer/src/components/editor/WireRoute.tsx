"use client";

import { Group, Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { PowerRoutingLine } from "@/types";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";

interface WireRouteProps {
  wire: PowerRoutingLine;
  pixelsPerInch: number;
}

export function WireRoute({ wire, pixelsPerInch }: WireRouteProps) {
  const updateWireJoint = useLayoutStore((s) => s.updateWireJoint);
  const removeWire = useLayoutStore((s) => s.removeWire);
  const shelves = useLayoutStore((s) => s.shelvingSegments);
  const arch = useLayoutStore((s) => s.archElements);

  const startShelf = shelves.find((s) => s.id === wire.startShelfId);
  const endOutlet = arch.find((a) => a.id === wire.endOutletId);
  if (!startShelf || !endOutlet) return null;

  const points = [
    startShelf.x * pixelsPerInch,
    startShelf.y * pixelsPerInch,
    ...wire.joints.flatMap((j) => [j.x * pixelsPerInch, j.y * pixelsPerInch]),
    endOutlet.x * pixelsPerInch,
    endOutlet.y * pixelsPerInch,
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
        stroke="#6366f1"
        strokeWidth={2}
        dash={[6, 4]}
        lineJoin="round"
        lineCap="round"
        opacity={0.9}
        listening={false}
      />
      {wire.joints.map((j, i) => (
        <Circle
          key={i}
          x={j.x * pixelsPerInch}
          y={j.y * pixelsPerInch}
          radius={5}
          fill="#6366f1"
          stroke="#fff"
          strokeWidth={1}
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

/** Renders the in-flight wire while user is drawing. */
export function WireInProgressPreview({
  pixelsPerInch,
}: WireInProgressPreviewProps) {
  const shelves = useLayoutStore((s) => s.shelvingSegments);
  const wip = useEditorStore((s) => s.wireInProgress);
  if (!wip) return null;
  const start = shelves.find((s) => s.id === wip.startShelfId);
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
      stroke="#6366f1"
      strokeWidth={2}
      dash={[6, 4]}
      opacity={0.8}
      listening={false}
    />
  );
}
