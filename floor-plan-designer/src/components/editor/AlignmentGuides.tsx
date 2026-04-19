"use client";

import { Group, Line } from "react-konva";
import { useEditorStore } from "@/store/useEditorStore";
import { EDITOR_COLORS } from "@/lib/constants";

interface AlignmentGuidesProps {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

/** Draws full-viewport dashed guides at stage-local coordinates. */
export function AlignmentGuides({
  width,
  height,
  offsetX,
  offsetY,
}: AlignmentGuidesProps) {
  const guides = useEditorStore((s) => s.alignmentGuides);
  if (!guides.length) return null;

  // The Layer sits inside a Stage that's already offset by (panX, panY). The
  // guides are in canvas-space pixels (already scaled). We want them to span
  // the full viewport, so translate by -offset.

  return (
    <Group listening={false}>
      {guides.map((g, i) =>
        g.orientation === "horizontal" ? (
          <Line
            key={`h${i}`}
            points={[-offsetX, g.position, width - offsetX, g.position]}
            stroke={EDITOR_COLORS.selection}
            strokeWidth={1}
            dash={[6, 4]}
            opacity={0.9}
          />
        ) : (
          <Line
            key={`v${i}`}
            points={[g.position, -offsetY, g.position, height - offsetY]}
            stroke={EDITOR_COLORS.selection}
            strokeWidth={1}
            dash={[6, 4]}
            opacity={0.9}
          />
        ),
      )}
    </Group>
  );
}
