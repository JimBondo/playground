"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { rotatedAabb, shelfBox, archElementBox } from "@/lib/collision";
import { ARCH_ELEMENT_DEFAULTS } from "@/lib/constants";
import type { ArchElement, ShelvingSegment, SelectedObject } from "@/types";

interface ContextMenuProps {
  selected: SelectedObject;
  pixelsPerInch: number;
  panX: number;
  panY: number;
}

const DOOR_TYPES = new Set(["singleDoor", "doubleDoor"]);
const HINGED = new Set(["singleDoor", "doubleDoor", "wallFridge"]);

export function ContextMenu({
  selected,
  pixelsPerInch,
  panX,
  panY,
}: ContextMenuProps) {
  const shelves = useLayoutStore((s) => s.shelvingSegments);
  const arch = useLayoutStore((s) => s.archElements);
  const duplicateShelf = useLayoutStore((s) => s.duplicateShelf);
  const rotateShelf = useLayoutStore((s) => s.rotateShelf);
  const removeShelf = useLayoutStore((s) => s.removeShelf);
  const addArchElement = useLayoutStore((s) => s.addArchElement);
  const updateArchElement = useLayoutStore((s) => s.updateArchElement);
  const removeArchElement = useLayoutStore((s) => s.removeArchElement);
  const setSelection = useLayoutStore((s) => s.setSelection);

  let aabb: { x: number; y: number; width: number; height: number } | null = null;
  let shelf: ShelvingSegment | undefined;
  let el: ArchElement | undefined;

  if (selected.type === "shelf") {
    shelf = shelves.find((s) => s.id === selected.id);
    if (!shelf) return null;
    aabb = rotatedAabb(shelfBox(shelf));
  } else if (selected.type === "archElement") {
    el = arch.find((a) => a.id === selected.id);
    if (!el) return null;
    aabb = rotatedAabb(archElementBox(el));
  } else {
    return null;
  }

  if (!aabb) return null;

  const left = aabb.x * pixelsPerInch + panX;
  const top = aabb.y * pixelsPerInch + panY - 38;
  const width = aabb.width * pixelsPerInch;

  const duplicate = () => {
    if (shelf) {
      const id = duplicateShelf(shelf.id);
      if (id) setSelection([{ type: "shelf", id }]);
    } else if (el) {
      const defaults = ARCH_ELEMENT_DEFAULTS[el.type];
      const offsetInches = el.widthInches + 2;
      const id = addArchElement({
        type: el.type,
        x: el.x + offsetInches,
        y: el.y,
        rotation: el.rotation,
        widthInches: el.widthInches,
        depthInches: el.depthInches,
        swingDirection: el.swingDirection ?? undefined,
        hingeSide: el.hingeSide ?? undefined,
      });
      void defaults;
      setSelection([{ type: "archElement", id }]);
    }
  };

  const rotate = () => {
    if (shelf) {
      rotateShelf(shelf.id);
    } else if (el) {
      updateArchElement(el.id, { rotation: (el.rotation + 90) % 360 });
    }
  };

  const removeIt = () => {
    if (shelf) removeShelf(shelf.id);
    else if (el) removeArchElement(el.id);
  };

  const flipHinge = () => {
    if (!el) return;
    const next = el.hingeSide === "right" ? "left" : "right";
    updateArchElement(el.id, { hingeSide: next });
  };
  const flipSwing = () => {
    if (!el) return;
    const next = el.swingDirection === "outward" ? "inward" : "outward";
    updateArchElement(el.id, { swingDirection: next });
  };

  const showHinge = el && HINGED.has(el.type);
  const showSwing = el && (DOOR_TYPES.has(el.type) || el.type === "wallFridge");

  return (
    <div
      className="pointer-events-auto absolute z-30 flex gap-1 rounded-md border border-slate-300 bg-white px-1 py-1 text-[11px] font-medium text-slate-700 shadow-md"
      style={{ left, top, minWidth: width }}
    >
      <button
        onClick={duplicate}
        className="rounded px-2 py-1 hover:bg-slate-100 hover:text-[#2563eb]"
        title="Duplicate (Ctrl/Cmd+D)"
      >
        +
      </button>
      <button
        onClick={rotate}
        className="rounded px-2 py-1 hover:bg-slate-100 hover:text-[#2563eb]"
        title="Rotate 90° (R)"
      >
        ↻
      </button>
      {showSwing ? (
        <button
          onClick={flipSwing}
          className="rounded px-2 py-1 hover:bg-slate-100 hover:text-[#2563eb]"
          title="Flip swing (in/out)"
        >
          ⇅
        </button>
      ) : null}
      {showHinge ? (
        <button
          onClick={flipHinge}
          className="rounded px-2 py-1 hover:bg-slate-100 hover:text-[#2563eb]"
          title="Swap hinge side (L/R)"
        >
          ⇆
        </button>
      ) : null}
      <button
        onClick={removeIt}
        className="rounded px-2 py-1 hover:bg-red-50 hover:text-red-600"
        title="Delete (Del)"
      >
        ×
      </button>
    </div>
  );
}
