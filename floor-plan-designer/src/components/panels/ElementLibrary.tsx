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

const ARCH_ORDER: ArchElementType[] = [
  "singleDoor",
  "doubleDoor",
  "outlet",
  "wallFridge",
  "freezerChest",
  "frontCounter",
];

const SHELF_ORDER: ShelfType[] = [
  "standard",
  "endCap",
  "pegBoard",
  "litShelf",
  "unlitShelf",
];

function LibraryItem({
  label,
  note,
  onDragStart: handler,
}: {
  label: string;
  note?: string;
  onDragStart: React.DragEventHandler;
}) {
  return (
    <li
      draggable
      onDragStart={handler}
      className="group flex cursor-grab select-none items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-700 shadow-sm transition-colors hover:border-[#2563eb] hover:text-[#1d4ed8] active:cursor-grabbing"
      title="Drag onto the canvas"
    >
      <span>{label}</span>
      {note ? (
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {note}
        </span>
      ) : null}
    </li>
  );
}

export function ElementLibrary() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3 text-slate-700">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Architectural
          </h2>
        </div>
        <ul className="flex flex-col gap-1.5">
          {ARCH_ORDER.map((t) => (
            <LibraryItem
              key={t}
              label={ARCH_ELEMENT_DEFAULTS[t].label}
              note={
                t === "singleDoor" || t === "doubleDoor" ? "wall" : undefined
              }
              onDragStart={onDragStart({ kind: "arch", type: t })}
            />
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Shelving
          </h2>
        </div>
        <ul className="flex flex-col gap-1.5">
          {SHELF_ORDER.map((t) => (
            <LibraryItem
              key={t}
              label={SHELF_DEFAULTS[t].label}
              note={t === "litShelf" ? "needs outlet" : undefined}
              onDragStart={onDragStart({ kind: "shelf", type: t })}
            />
          ))}
        </ul>
      </div>
      <p className="mt-auto text-[11px] leading-snug text-slate-400">
        Drag items onto the floor plan. Doors snap to walls automatically.
      </p>
    </aside>
  );
}
