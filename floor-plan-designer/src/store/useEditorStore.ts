import { create } from "zustand";
import type { AlignmentGuide, Point } from "@/types";

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

export interface WireInProgress {
  startShelfId: string;
  joints: Point[]; // stored in inches
  cursor: Point | null; // tentative next point while user moves mouse
}

interface EditorState {
  dragPreview: DragPreview | null;
  alignmentGuides: AlignmentGuide[];
  selectionBox: SelectionBoxState | null;
  shiftHeld: boolean;
  wireInProgress: WireInProgress | null;

  setDragPreview: (p: DragPreview | null) => void;
  setAlignmentGuides: (g: AlignmentGuide[]) => void;
  setSelectionBox: (b: SelectionBoxState | null) => void;
  setShiftHeld: (v: boolean) => void;
  startWire: (shelfId: string) => void;
  pushWireJoint: (p: Point) => void;
  updateWireCursor: (p: Point | null) => void;
  cancelWire: () => void;
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
  wireInProgress: null,
  setDragPreview: (p) => set({ dragPreview: p }),
  setAlignmentGuides: (g) => set({ alignmentGuides: g }),
  setSelectionBox: (b) => set({ selectionBox: b }),
  setShiftHeld: (v) => set({ shiftHeld: v }),
  startWire: (shelfId) =>
    set({ wireInProgress: { startShelfId: shelfId, joints: [], cursor: null } }),
  pushWireJoint: (p) =>
    set((s) =>
      s.wireInProgress
        ? {
            wireInProgress: {
              ...s.wireInProgress,
              joints: [...s.wireInProgress.joints, p],
            },
          }
        : {},
    ),
  updateWireCursor: (p) =>
    set((s) =>
      s.wireInProgress
        ? { wireInProgress: { ...s.wireInProgress, cursor: p } }
        : {},
    ),
  cancelWire: () => set({ wireInProgress: null }),
}));
