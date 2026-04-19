"use client";

import { Line } from "react-konva";
import { EDITOR_COLORS } from "@/lib/constants";
import type { Point } from "@/types";

interface RoomPolygonProps {
  vertices: Point[];
  pixelsPerInch: number;
  wallThicknessInches: number;
}

export function RoomPolygon({
  vertices,
  pixelsPerInch,
  wallThicknessInches,
}: RoomPolygonProps) {
  if (vertices.length < 3) return null;

  const flat: number[] = [];
  for (const v of vertices) {
    flat.push(v.x * pixelsPerInch, v.y * pixelsPerInch);
  }

  return (
    <>
      <Line
        points={flat}
        closed
        fill={EDITOR_COLORS.room}
        opacity={0.5}
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
    </>
  );
}
