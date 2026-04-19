"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { rotatedAabb, shelfBox } from "@/lib/collision";
import type { ShelvingSegment } from "@/types";

interface ContextMenuProps {
  shelf: ShelvingSegment;
  pixelsPerInch: number;
  panX: number;
  panY: number;
}

export function ContextMenu({
  shelf,
  pixelsPerInch,
  panX,
  panY,
}: ContextMenuProps) {
  const duplicateShelf = useLayoutStore((s) => s.duplicateShelf);
  const rotateShelf = useLayoutStore((s) => s.rotateShelf);
  const removeShelf = useLayoutStore((s) => s.removeShelf);

  // Anchor above the shelf's bounding box.
  const aabb = rotatedAabb(shelfBox(shelf));
  const left = aabb.x * pixelsPerInch + panX;
  const top = aabb.y * pixelsPerInch + panY - 36;
  const width = aabb.width * pixelsPerInch;

  return (
    <div
      className="pointer-events-auto absolute z-30 flex gap-1 border border-[#00ffff] bg-black/85 px-1 py-1 text-[10px] uppercase tracking-widest text-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.3)]"
      style={{ left, top, minWidth: width }}
    >
      <button
        onClick={() => duplicateShelf(shelf.id)}
        className="px-2 py-1 hover:bg-[#00ffff] hover:text-black"
        title="Duplicate (Ctrl+D)"
      >
        +
      </button>
      <button
        onClick={() => rotateShelf(shelf.id)}
        className="px-2 py-1 hover:bg-[#00ffff] hover:text-black"
        title="Rotate 90° (R)"
      >
        ↻
      </button>
      <button
        onClick={() => removeShelf(shelf.id)}
        className="px-2 py-1 hover:bg-[#ff3b6b] hover:text-white"
        title="Delete (Del)"
      >
        ×
      </button>
    </div>
  );
}
