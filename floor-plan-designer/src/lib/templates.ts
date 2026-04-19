import type { ArchElement, Room, ShelvingSegment } from "@/types";
import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "./constants";

export interface TemplateArchSeed
  extends Omit<
    ArchElement,
    "id" | "widthInches" | "depthInches" | "rotation"
  > {
  rotation?: number;
  widthInches?: number;
  depthInches?: number;
}

export type TemplateShelfSeed = Omit<ShelvingSegment, "id" | "snappedConnections" | "powerSource"> & {
  powered?: boolean; // seed as directly wired to first outlet (test convenience)
};

export interface Template {
  id: string;
  name: string;
  description: string;
  room: Room;
  archElements: TemplateArchSeed[];
  shelvingSegments: TemplateShelfSeed[];
}

function shelf(
  type: keyof typeof SHELF_DEFAULTS,
  x: number,
  y: number,
  rotation = 0,
  overrides: Partial<TemplateShelfSeed> = {},
): TemplateShelfSeed {
  const d = SHELF_DEFAULTS[type];
  return {
    type,
    lengthInches: d.lengthInches,
    widthInches: d.widthInches,
    heightInches: d.heightInches,
    x,
    y,
    rotation,
    ...overrides,
  };
}

/** Helper: lay out a row of snapped shelves side by side at (x, y). */
function shelfRow(
  type: keyof typeof SHELF_DEFAULTS,
  count: number,
  startX: number,
  y: number,
  rotation = 0,
): TemplateShelfSeed[] {
  const out: TemplateShelfSeed[] = [];
  const len = SHELF_DEFAULTS[type].lengthInches;
  for (let i = 0; i < count; i++) {
    out.push(shelf(type, startX + i * len, y, rotation));
  }
  return out;
}

export const TEMPLATES: Template[] = [
  {
    id: "blank-rect",
    name: "Blank Rectangle",
    description: "50ft × 30ft empty room. Start from scratch.",
    room: {
      polygonVertices: [
        { x: 0, y: 0 },
        { x: 600, y: 0 },
        { x: 600, y: 360 },
        { x: 0, y: 360 },
      ],
      wallThicknessInches: 6,
    },
    archElements: [],
    shelvingSegments: [],
  },
  {
    id: "small-retail",
    name: "Small Retail",
    description: "20ft × 15ft — storefront door, counter, two-aisle shelving.",
    room: {
      polygonVertices: [
        { x: 0, y: 0 },
        { x: 240, y: 0 },
        { x: 240, y: 180 },
        { x: 0, y: 180 },
      ],
      wallThicknessInches: 6,
    },
    archElements: [
      { type: "singleDoor", x: 120, y: 0, hingeSide: "left", swingDirection: "inward" },
      { type: "outlet", x: 12, y: 12 },
      { type: "outlet", x: 228, y: 168 },
      { type: "frontCounter", x: 80, y: 30 },
    ],
    shelvingSegments: [
      // Two side-by-side aisles of standard shelves
      ...shelfRow("standard", 2, 40, 100),
      ...shelfRow("standard", 2, 40, 140),
    ],
  },
  {
    id: "convenience-store",
    name: "Convenience Store",
    description:
      "40ft × 25ft — double door, front counter, wall coolers, freezer, aisles.",
    room: {
      polygonVertices: [
        { x: 0, y: 0 },
        { x: 480, y: 0 },
        { x: 480, y: 300 },
        { x: 0, y: 300 },
      ],
      wallThicknessInches: 6,
    },
    archElements: [
      {
        type: "doubleDoor",
        x: 240,
        y: 0,
        hingeSide: "left",
        swingDirection: "inward",
      },
      { type: "frontCounter", x: 80, y: 30 },
      // Wall coolers along the back wall
      { type: "wallFridge", x: 80, y: 280, rotation: 180, swingDirection: "outward", hingeSide: "left" },
      { type: "wallFridge", x: 152, y: 280, rotation: 180, swingDirection: "outward", hingeSide: "left" },
      { type: "wallFridge", x: 224, y: 280, rotation: 180, swingDirection: "outward", hingeSide: "left" },
      { type: "wallFridge", x: 296, y: 280, rotation: 180, swingDirection: "outward", hingeSide: "right" },
      { type: "wallFridge", x: 368, y: 280, rotation: 180, swingDirection: "outward", hingeSide: "right" },
      // Freezer chest
      { type: "freezerChest", x: 410, y: 160 },
      // Outlets (one per 8 ft of wall, roughly)
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 460, y: 20 },
      { type: "outlet", x: 20, y: 280 },
      { type: "outlet", x: 460, y: 280 },
    ],
    shelvingSegments: [
      // Two aisles through the middle
      ...shelfRow("standard", 4, 110, 140),
      ...shelfRow("standard", 4, 110, 200),
      // End caps
      shelf("endCap", 86, 170),
      shelf("endCap", 110 + 4 * 48 + 24, 170),
    ],
  },
  {
    id: "large-retail",
    name: "Large Retail",
    description:
      "80ft × 50ft — multi-aisle grocery layout with lit end caps and coolers.",
    room: {
      polygonVertices: [
        { x: 0, y: 0 },
        { x: 960, y: 0 },
        { x: 960, y: 600 },
        { x: 0, y: 600 },
      ],
      wallThicknessInches: 6,
    },
    archElements: [
      { type: "doubleDoor", x: 300, y: 0, hingeSide: "left", swingDirection: "inward" },
      { type: "doubleDoor", x: 660, y: 0, hingeSide: "right", swingDirection: "inward" },
      // Wall coolers on the back wall
      ...Array.from({ length: 10 }).map((_, i) => ({
        type: "wallFridge" as const,
        x: 100 + i * 72,
        y: 580,
        rotation: 180,
        swingDirection: "outward" as const,
        hingeSide: (i % 2 === 0 ? "left" : "right") as "left" | "right",
      })),
      // Freezers along the right wall
      { type: "freezerChest", x: 920, y: 150 },
      { type: "freezerChest", x: 920, y: 220 },
      { type: "freezerChest", x: 920, y: 290 },
      // Front counters near entrance
      { type: "frontCounter", x: 200, y: 50 },
      { type: "frontCounter", x: 760, y: 50 },
      // Outlets
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 940, y: 20 },
      { type: "outlet", x: 20, y: 580 },
      { type: "outlet", x: 940, y: 580 },
      { type: "outlet", x: 480, y: 20 },
      { type: "outlet", x: 20, y: 300 },
      { type: "outlet", x: 940, y: 300 },
      { type: "outlet", x: 480, y: 580 },
    ],
    shelvingSegments: [
      // 4 aisles, each with a lit end cap on one side
      ...shelfRow("endCap", 1, 140, 150),
      ...shelfRow("standard", 6, 188, 150),
      ...shelfRow("standard", 6, 188, 220),
      ...shelfRow("endCap", 1, 140, 350),
      ...shelfRow("standard", 6, 188, 350),
      ...shelfRow("standard", 6, 188, 420),
      // Peg board run
      ...shelfRow("pegBoard", 4, 560, 150),
    ],
  },
  {
    id: "l-shaped",
    name: "L-Shaped",
    description: "60×40ft with a 20×20ft cutout. Door + two rows of shelving.",
    room: {
      polygonVertices: [
        { x: 0, y: 0 },
        { x: 480, y: 0 },
        { x: 480, y: 240 },
        { x: 720, y: 240 },
        { x: 720, y: 480 },
        { x: 0, y: 480 },
      ],
      wallThicknessInches: 6,
    },
    archElements: [
      { type: "doubleDoor", x: 200, y: 0, hingeSide: "left", swingDirection: "inward" },
      { type: "frontCounter", x: 100, y: 40 },
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 460, y: 20 },
      { type: "outlet", x: 700, y: 460 },
      { type: "outlet", x: 20, y: 460 },
    ],
    shelvingSegments: [
      ...shelfRow("standard", 5, 80, 200),
      ...shelfRow("standard", 5, 80, 260),
      ...shelfRow("standard", 3, 520, 400),
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function resolveArchSeed(seed: TemplateArchSeed): Omit<ArchElement, "id"> {
  const defaults = ARCH_ELEMENT_DEFAULTS[seed.type];
  return {
    type: seed.type,
    x: seed.x,
    y: seed.y,
    rotation: seed.rotation ?? 0,
    widthInches: seed.widthInches ?? defaults.widthInches,
    depthInches: seed.depthInches ?? defaults.depthInches,
    swingDirection: seed.swingDirection,
    hingeSide: seed.hingeSide,
  };
}

export function resolveShelfSeed(seed: TemplateShelfSeed): Omit<ShelvingSegment, "id"> {
  return {
    type: seed.type,
    lengthInches: seed.lengthInches,
    widthInches: seed.widthInches,
    heightInches: seed.heightInches,
    x: seed.x,
    y: seed.y,
    rotation: seed.rotation,
    powerSource: { connectedOutletId: null, daisyChainedFrom: null },
    snappedConnections: { leftId: null, rightId: null },
  };
}
