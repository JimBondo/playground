import type {
  ArchElementType,
  ShelfType,
  ViewState,
  Room,
} from "@/types";

export const SNAP_THRESHOLD_PX = 15;
export const ALIGNMENT_THRESHOLD_PX = 5;
export const WALL_SNAP_DISTANCE_IN = 24; // 2 ft from wall counts as "on wall"

export const DEFAULT_VIEW: ViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  basePixelsPerInch: 4,
  showGrid: true,
  showMeasurements: true,
  showAlignmentGuides: true,
  gridSpacingInches: 12,
  snapToGrid: false,
  activeMode: "select",
};

export const DEFAULT_ROOM: Room = {
  polygonVertices: [
    { x: 0, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 360 },
    { x: 0, y: 360 },
  ],
  wallThicknessInches: 6,
};

export const ARCH_ELEMENT_DEFAULTS: Record<
  ArchElementType,
  { widthInches: number; depthInches: number; label: string; electrical?: boolean }
> = {
  freezerChest: {
    widthInches: 72,
    depthInches: 30,
    label: "Freezer Chest",
    electrical: true,
  },
  wallFridge: {
    widthInches: 36,
    depthInches: 30,
    label: "Wall Fridge",
    electrical: true,
  },
  frontCounter: {
    widthInches: 72,
    depthInches: 24,
    label: "Front Counter",
  },
  outlet: { widthInches: 8, depthInches: 8, label: "Outlet", electrical: true },
  singleDoor: { widthInches: 36, depthInches: 6, label: "Single Door" },
  doubleDoor: { widthInches: 72, depthInches: 6, label: "Double Door" },
};

export const SHELF_DEFAULTS: Record<
  ShelfType,
  {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    label: string;
  }
> = {
  endCap: { lengthInches: 48, widthInches: 24, heightInches: 84, label: "End Cap" },
  standard: { lengthInches: 48, widthInches: 24, heightInches: 84, label: "Standard" },
  pegBoard: { lengthInches: 48, widthInches: 12, heightInches: 84, label: "Peg Board" },
  litShelf: { lengthInches: 48, widthInches: 24, heightInches: 84, label: "Lit Shelf" },
  unlitShelf: { lengthInches: 48, widthInches: 24, heightInches: 84, label: "Unlit Shelf" },
};

/** Draftsman-style light palette optimized for readability over style. */
export const EDITOR_COLORS = {
  pageBg: "#f5f5f4", // panel/chrome
  canvasBg: "#fafaf9",
  panel: "#ffffff",
  border: "#d4d4d8",
  borderStrong: "#a1a1aa",
  text: "#18181b",
  textMuted: "#52525b",
  textFaint: "#71717a",
  accent: "#2563eb", // primary selection blue
  accentSoft: "#60a5fa",
  danger: "#dc2626",
  warning: "#d97706",
  success: "#059669",
  grid: "#e5e7eb",
  gridMajor: "#d4d4d8",
  wall: "#1f2937",
  roomFill: "rgba(0, 0, 0, 0.02)",

  // Element type fills / strokes (soft fills, darker borders)
  shelf: { fill: "#f3f4f6", stroke: "#374151" },
  shelfLit: { fill: "#fef9c3", stroke: "#a16207", halo: "rgba(250, 204, 21, 0.4)" },
  shelfEndCap: { fill: "#e0e7ff", stroke: "#4338ca" },
  shelfPegBoard: { fill: "#ede9fe", stroke: "#6d28d9" },
  freezer: { fill: "#dbeafe", stroke: "#1d4ed8" },
  wallFridge: { fill: "#cffafe", stroke: "#0e7490" },
  frontCounter: { fill: "#fef3c7", stroke: "#b45309" },
  door: { stroke: "#0f172a" },
  outlet: { fill: "#ffffff", stroke: "#0f172a" },

  // Electrical wire — solid orange, high contrast against white
  wire: "#ea580c",
  wireJoint: "#c2410c",

  // Power status dots
  powered: "#059669",
  unpowered: "#d97706",
} as const;
