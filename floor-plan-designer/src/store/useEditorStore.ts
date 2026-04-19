import { create } from "zustand";
import type { AlignmentGuide } from "@/types";

export interface DragPreview {
  id: string;
  kind: "shelf" | "archElement";
  x: number; // inches
  y: number;
  width: number; // inches (bounding box)
  height: number;
  rotation: number;
  colliding: boolean;
}

export interface SelectionBoxState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface EditorState {
  dragPreview: DragPreview | null;
  alignmentGuides: AlignmentGuide[];
  selectionBox: SelectionBoxState | null;
  shiftHeld: boolean;

  setDragPreview: (p: DragPreview | null) => void;
  setAlignmentGuides: (g: AlignmentGuide[]) => void;
  setSelectionBox: (b: SelectionBoxState | null) => void;
  setShiftHeld: (v: boolean) => void;
}

/**
 * Transient editor state — never persisted, never tracked by undo/redo.
 * Separate store so it can't accidentally get recorded by zundo.
 */
export const useEditorStore = create<EditorState>((set) => ({
  dragPreview: null,
  alignmentGuides: [],
  selectionBox: null,
  shiftHeld: false,
  setDragPreview: (p) => set({ dragPreview: p }),
  setAlignmentGuides: (g) => set({ alignmentGuides: g }),
  setSelectionBox: (b) => set({ selectionBox: b }),
  setShiftHeld: (v) => set({ shiftHeld: v }),
}));
