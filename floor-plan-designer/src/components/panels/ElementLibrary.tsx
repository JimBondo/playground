"use client";

import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "@/lib/constants";
import type { ArchElementType, ShelfType } from "@/types";

export type LibraryPayload =
  | { kind: "arch"; type: ArchElementType }
  | { kind: "shelf"; type: ShelfType };

export const LIBRARY_MIME = "application/x-fpd-library";

function onDragStart(payload: LibraryPayload) {
  return (e: React.DragEvent) => {
    e.dataTransfer.setData(LIBRARY_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };
}

export function ElementLibrary() {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-black/30 p-4 text-xs uppercase tracking-widest text-white/70">
      <div>
        <div className="mb-2 font-mono text-[#ff00ff]">Architectural</div>
        <ul className="space-y-1 font-mono">
          {(Object.keys(ARCH_ELEMENT_DEFAULTS) as ArchElementType[]).map(
            (key) => (
              <li
                key={key}
                draggable
                onDragStart={onDragStart({ kind: "arch", type: key })}
                className="cursor-grab border border-white/10 px-2 py-1 transition-colors hover:border-[#00ffff] hover:text-[#00ffff] active:cursor-grabbing"
              >
                {ARCH_ELEMENT_DEFAULTS[key].label}
              </li>
            ),
          )}
        </ul>
      </div>
      <div>
        <div className="mb-2 font-mono text-[#ff00ff]">Shelving</div>
        <ul className="space-y-1 font-mono">
          {(Object.keys(SHELF_DEFAULTS) as ShelfType[]).map((key) => (
            <li
              key={key}
              draggable
              onDragStart={onDragStart({ kind: "shelf", type: key })}
              className="cursor-grab border border-white/10 px-2 py-1 transition-colors hover:border-[#00ffff] hover:text-[#00ffff] active:cursor-grabbing"
            >
              {SHELF_DEFAULTS[key].label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
