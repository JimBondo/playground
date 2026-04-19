"use client";

import { Text, Group, Rect } from "react-konva";
import { formatFeetInches, distance } from "@/lib/geometry";
import type { Point } from "@/types";

interface MeasurementOverlayProps {
  vertices: Point[];
  pixelsPerInch: number;
}

export function MeasurementOverlay({
  vertices,
  pixelsPerInch,
}: MeasurementOverlayProps) {
  if (vertices.length < 2) return null;

  return (
    <Group listening={false}>
      {vertices.map((a, i) => {
        const b = vertices[(i + 1) % vertices.length];
        const lengthInches = distance(a, b);
        if (lengthInches < 1) return null;
        const midX = ((a.x + b.x) / 2) * pixelsPerInch;
        const midY = ((a.y + b.y) / 2) * pixelsPerInch;
        const label = formatFeetInches(lengthInches);
        const rotation =
          (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        // Flip label so it reads left→right when wall is upside-down.
        const flipped = rotation > 90 || rotation < -90;
        const finalRotation = flipped ? rotation + 180 : rotation;
        const boxWidth = Math.max(32, label.length * 7 + 8);

        return (
          <Group
            key={`m-${i}`}
            x={midX}
            y={midY}
            rotation={finalRotation}
          >
            <Rect
              x={-boxWidth / 2}
              y={-18}
              width={boxWidth}
              height={14}
              fill="#0b0612"
              stroke="#00ffff"
              strokeWidth={1}
              opacity={0.85}
            />
            <Text
              x={-boxWidth / 2}
              y={-16}
              width={boxWidth}
              align="center"
              text={label}
              fontSize={11}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill="#00ffff"
            />
          </Group>
        );
      })}
    </Group>
  );
}
