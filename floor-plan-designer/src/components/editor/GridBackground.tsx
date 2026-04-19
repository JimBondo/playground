"use client";

import { Line, Group } from "react-konva";
import { EDITOR_COLORS } from "@/lib/constants";

interface GridBackgroundProps {
  width: number;
  height: number;
  effectivePPI: number;
  gridSpacingInches: number;
  offsetX: number;
  offsetY: number;
}

/** Minor grid every 12", major every 60" (5ft). Both locked to world origin. */
export function GridBackground({
  width,
  height,
  effectivePPI,
  gridSpacingInches,
  offsetX,
  offsetY,
}: GridBackgroundProps) {
  const minor = gridSpacingInches * effectivePPI;
  if (minor <= 0) return null;
  const major = minor * 5;

  const startMinorX = -((offsetX % minor) + minor) % minor;
  const startMinorY = -((offsetY % minor) + minor) % minor;
  const startMajorX = -((offsetX % major) + major) % major;
  const startMajorY = -((offsetY % major) + major) % major;

  const minorVerticals: number[] = [];
  for (let x = startMinorX; x <= width; x += minor) minorVerticals.push(x);
  const minorHorizontals: number[] = [];
  for (let y = startMinorY; y <= height; y += minor) minorHorizontals.push(y);

  const majorVerticals: number[] = [];
  for (let x = startMajorX; x <= width; x += major) majorVerticals.push(x);
  const majorHorizontals: number[] = [];
  for (let y = startMajorY; y <= height; y += major) majorHorizontals.push(y);

  return (
    <Group listening={false}>
      {minorVerticals.map((x, i) => (
        <Line
          key={`mv${i}`}
          points={[x, 0, x, height]}
          stroke={EDITOR_COLORS.grid}
          strokeWidth={1}
        />
      ))}
      {minorHorizontals.map((y, i) => (
        <Line
          key={`mh${i}`}
          points={[0, y, width, y]}
          stroke={EDITOR_COLORS.grid}
          strokeWidth={1}
        />
      ))}
      {majorVerticals.map((x, i) => (
        <Line
          key={`Mv${i}`}
          points={[x, 0, x, height]}
          stroke={EDITOR_COLORS.gridMajor}
          strokeWidth={1}
        />
      ))}
      {majorHorizontals.map((y, i) => (
        <Line
          key={`Mh${i}`}
          points={[0, y, width, y]}
          stroke={EDITOR_COLORS.gridMajor}
          strokeWidth={1}
        />
      ))}
    </Group>
  );
}
