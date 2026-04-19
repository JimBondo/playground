import type Konva from "konva";

let current: Konva.Stage | null = null;

export function setStage(stage: Konva.Stage | null) {
  current = stage;
}

export function getStage(): Konva.Stage | null {
  return current;
}
