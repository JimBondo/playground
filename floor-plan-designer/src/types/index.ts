export interface ProjectInfo {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  basePixelsPerInch: number;
  showGrid: boolean;
  showMeasurements: boolean;
  showAlignmentGuides: boolean;
  gridSpacingInches: number;
  snapToGrid: boolean;
  activeMode: "select" | "wire" | "elevationSelect";
}

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  polygonVertices: Point[];
  wallThicknessInches: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type ArchElementType =
  | "freezerChest"
  | "wallFridge"
  | "frontCounter"
  | "outlet"
  | "singleDoor"
  | "doubleDoor";

export interface ArchElement {
  id: string;
  type: ArchElementType;
  x: number;
  y: number;
  rotation: number;
  widthInches: number;
  depthInches: number;
  swingDirection?: "inward" | "outward";
}

export type ShelfType =
  | "endCap"
  | "standard"
  | "pegBoard"
  | "litShelf"
  | "unlitShelf";

export interface ShelvingSegment {
  id: string;
  type: ShelfType;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  x: number;
  y: number;
  rotation: number;
  powerSource: {
    connectedOutletId: string | null;
    daisyChainedFrom: string | null;
  };
  snappedConnections: {
    leftId: string | null;
    rightId: string | null;
  };
}

export interface PowerRoutingLine {
  id: string;
  startShelfId: string;
  endOutletId: string;
  joints: Point[];
}

export interface AlignmentGuide {
  orientation: "horizontal" | "vertical";
  position: number;
  type: "center" | "edge";
}

export type SelectedObjectKind = "shelf" | "archElement" | "vertex" | "wire";

export interface SelectedObject {
  type: SelectedObjectKind;
  id: string;
}

export type Selection = SelectedObject[];
