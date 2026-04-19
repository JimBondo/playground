import type { Room } from "@/types";
import { DEFAULT_ROOM } from "./constants";

export interface Template {
  id: string;
  name: string;
  description: string;
  room: Room;
}

export const TEMPLATES: Template[] = [
  {
    id: "blank-rect",
    name: "Blank Rectangle",
    description: "50ft × 30ft empty room. Start from scratch.",
    room: DEFAULT_ROOM,
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
