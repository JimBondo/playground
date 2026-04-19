import type { ArchElement, Room } from "@/types";
import { ARCH_ELEMENT_DEFAULTS } from "./constants";

export interface TemplateArchSeed
  extends Omit<
    ArchElement,
    "id" | "widthInches" | "depthInches" | "rotation"
  > {
  rotation?: number;
  widthInches?: number;
  depthInches?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  room: Room;
  archElements: TemplateArchSeed[];
}

/**
 * All coordinates are in inches. Room polygons always start at origin so
 * vertex math stays simple. Doors are positioned flush to an interior edge
 * and outlets are spread around the interior perimeter.
 */
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
  },
  {
    id: "small-retail",
    name: "Small Retail",
    description: "20ft × 15ft — 1 single door, 2 outlets.",
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
      { type: "singleDoor", x: 100, y: 0, rotation: 0, swingDirection: "inward" },
      { type: "outlet", x: 20, y: 10 },
      { type: "outlet", x: 220, y: 170 },
    ],
  },
  {
    id: "convenience-store",
    name: "Convenience Store",
    description: "40ft × 25ft — 1 double door, 4 outlets, 1 front counter.",
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
      { type: "doubleDoor", x: 200, y: 0, rotation: 0, swingDirection: "inward" },
      { type: "frontCounter", x: 100, y: 40 },
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 460, y: 20 },
      { type: "outlet", x: 20, y: 280 },
      { type: "outlet", x: 460, y: 280 },
    ],
  },
  {
    id: "large-retail",
    name: "Large Retail",
    description: "80ft × 50ft — 2 double doors, 8 outlets.",
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
      { type: "doubleDoor", x: 300, y: 0, rotation: 0, swingDirection: "inward" },
      { type: "doubleDoor", x: 600, y: 0, rotation: 0, swingDirection: "inward" },
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 940, y: 20 },
      { type: "outlet", x: 20, y: 580 },
      { type: "outlet", x: 940, y: 580 },
      { type: "outlet", x: 480, y: 20 },
      { type: "outlet", x: 480, y: 580 },
      { type: "outlet", x: 20, y: 300 },
      { type: "outlet", x: 940, y: 300 },
    ],
  },
  {
    id: "l-shaped",
    name: "L-Shaped",
    description: "60×40ft with a 20×20ft cutout. 1 double door, 4 outlets.",
    room: {
      // 720×480 L-shape: corner cut from top-right (starting at 480,0).
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
      { type: "doubleDoor", x: 200, y: 0, rotation: 0, swingDirection: "inward" },
      { type: "outlet", x: 20, y: 20 },
      { type: "outlet", x: 460, y: 20 },
      { type: "outlet", x: 700, y: 460 },
      { type: "outlet", x: 20, y: 460 },
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Fill in default widthInches/depthInches for elements that omit them. */
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
  };
}
