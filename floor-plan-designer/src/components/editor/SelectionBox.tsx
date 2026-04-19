"use client";

import { Rect } from "react-konva";
import { useEditorStore } from "@/store/useEditorStore";
import { EDITOR_COLORS } from "@/lib/constants";

export function SelectionBox() {
  const box = useEditorStore((s) => s.selectionBox);
  if (!box || !box.active) return null;
  const x = Math.min(box.startX, box.currentX);
  const y = Math.min(box.startY, box.currentY);
  const w = Math.abs(box.currentX - box.startX);
  const h = Math.abs(box.currentY - box.startY);
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      stroke={EDITOR_COLORS.accent}
      strokeWidth={1}
      dash={[4, 3]}
      fill={"rgba(37, 99, 235, 0.08)"}
      listening={false}
    />
  );
}
