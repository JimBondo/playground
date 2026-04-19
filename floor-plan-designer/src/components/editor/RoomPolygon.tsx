"use client";

import { Circle, Line, Group } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { EDITOR_COLORS } from "@/lib/constants";
import { useLayoutStore } from "@/store/useLayoutStore";
import type { Point } from "@/types";

interface RoomPolygonProps {
  vertices: Point[];
  pixelsPerInch: number;
  wallThicknessInches: number;
  interactive: boolean;
}

export function RoomPolygon({
  vertices,
  pixelsPerInch,
  wallThicknessInches,
  interactive,
}: RoomPolygonProps) {
  const updateVertex = useLayoutStore((s) => s.updateVertex);
  const addVertex = useLayoutStore((s) => s.addVertex);
  const removeVertex = useLayoutStore((s) => s.removeVertex);

  if (vertices.length < 3) return null;

  const flat: number[] = [];
  for (const v of vertices) {
    flat.push(v.x * pixelsPerInch, v.y * pixelsPerInch);
  }

  const onVertexDragEnd = (index: number) => (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateVertex(index, {
      x: node.x() / pixelsPerInch,
      y: node.y() / pixelsPerInch,
    });
  };

  const onMidpointClick = (afterIndex: number, mid: Point) => () => {
    addVertex(afterIndex, mid);
  };

  const onVertexDoubleClick = (index: number) => () => {
    removeVertex(index);
  };

  return (
    <Group>
      <Line
        points={flat}
        closed
        fill={EDITOR_COLORS.room}
        opacity={0.55}
        listening={false}
      />
      <Line
        points={flat}
        closed
        stroke={EDITOR_COLORS.wall}
        strokeWidth={Math.max(2, wallThicknessInches * pixelsPerInch)}
        lineJoin="miter"
        listening={false}
      />

      {interactive &&
        vertices.map((v, i) => {
          const next = vertices[(i + 1) % vertices.length];
          const midIn: Point = {
            x: (v.x + next.x) / 2,
            y: (v.y + next.y) / 2,
          };
          return (
            <Circle
              key={`mid-${i}`}
              x={midIn.x * pixelsPerInch}
              y={midIn.y * pixelsPerInch}
              radius={5}
              fill={EDITOR_COLORS.accent}
              stroke="#000"
              strokeWidth={1}
              opacity={0.75}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "copy";
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "default";
              }}
              onClick={onMidpointClick(i, midIn)}
              onTap={onMidpointClick(i, midIn)}
            />
          );
        })}

      {interactive &&
        vertices.map((v, i) => (
          <Circle
            key={`v-${i}`}
            x={v.x * pixelsPerInch}
            y={v.y * pixelsPerInch}
            radius={7}
            fill={EDITOR_COLORS.selection}
            stroke="#000"
            strokeWidth={1}
            draggable
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "grab";
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "default";
            }}
            onDragEnd={onVertexDragEnd(i)}
            onDblClick={onVertexDoubleClick(i)}
            onDblTap={onVertexDoubleClick(i)}
          />
        ))}
    </Group>
  );
}
