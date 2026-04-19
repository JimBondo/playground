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

/**
 * Infinite-feeling grid: lines are drawn across the viewport, aligned to the
 * origin in canvas-space. `offsetX/Y` are the current pan values so the grid
 * stays locked to the world, not the screen.
 */
export function GridBackground({
  width,
  height,
  effectivePPI,
  gridSpacingInches,
  offsetX,
  offsetY,
}: GridBackgroundProps) {
  const step = gridSpacingInches * effectivePPI;
  if (step <= 0) return null;

  const startX = -((offsetX % step) + step) % step;
  const startY = -((offsetY % step) + step) % step;

  const verticals: number[] = [];
  for (let x = startX; x <= width; x += step) verticals.push(x);

  const horizontals: number[] = [];
  for (let y = startY; y <= height; y += step) horizontals.push(y);

  return (
    <Group listening={false}>
      {verticals.map((x, i) => (
        <Line
          key={`v${i}`}
          points={[x, 0, x, height]}
          stroke={EDITOR_COLORS.grid}
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
      {horizontals.map((y, i) => (
        <Line
          key={`h${i}`}
          points={[0, y, width, y]}
          stroke={EDITOR_COLORS.grid}
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
    </Group>
  );
}
