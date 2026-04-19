import type {
  ArchElementType,
  ShelfType,
  ViewState,
  Room,
} from "@/types";

export const SNAP_THRESHOLD_PX = 15;
export const ALIGNMENT_THRESHOLD_PX = 5;

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
  { widthInches: number; depthInches: number; label: string }
> = {
  freezerChest: { widthInches: 72, depthInches: 30, label: "Freezer Chest" },
  wallFridge: { widthInches: 36, depthInches: 30, label: "Wall Fridge" },
  frontCounter: { widthInches: 72, depthInches: 24, label: "Front Counter" },
  outlet: { widthInches: 4, depthInches: 4, label: "Outlet" },
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

export const EDITOR_COLORS = {
  background: "#0b0612",
  canvas: "#140a22",
  grid: "#2d1b4e",
  gridMajor: "#4a2d78",
  wall: "#e0e0e0",
  room: "#1a103c",
  selection: "#00ffff",
  accent: "#ff00ff",
  danger: "#ff3b6b",
} as const;
