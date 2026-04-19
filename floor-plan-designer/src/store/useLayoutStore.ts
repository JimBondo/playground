import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import { nanoid } from "nanoid";

import {
  DEFAULT_ROOM,
  DEFAULT_VIEW,
} from "@/lib/constants";
import { getTemplate, resolveArchSeed } from "@/lib/templates";
import { polygonSquareFeet } from "@/lib/geometry";
import type {
  ArchElement,
  Point,
  PowerRoutingLine,
  ProjectInfo,
  Room,
  Selection,
  SelectedObject,
  ShelvingSegment,
  ViewState,
} from "@/types";

export interface LayoutState {
  project: ProjectInfo;
  view: ViewState;
  room: Room;
  archElements: ArchElement[];
  shelvingSegments: ShelvingSegment[];
  powerRoutingLines: PowerRoutingLine[];
  selection: Selection;
}

export interface LayoutActions {
  // View
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleMeasurements: () => void;
  toggleSnapToGrid: () => void;
  setActiveMode: (mode: ViewState["activeMode"]) => void;
  fitToRoom: (stageWidth: number, stageHeight: number) => void;

  // Room
  updateVertex: (index: number, point: Point) => void;
  addVertex: (afterIndex: number, point: Point) => void;
  removeVertex: (index: number) => void;
  setWallThickness: (inches: number) => void;
  loadTemplate: (templateId: string) => void;

  // Arch elements
  addArchElement: (element: Omit<ArchElement, "id">) => string;
  updateArchElement: (id: string, updates: Partial<ArchElement>) => void;
  removeArchElement: (id: string) => void;

  // Shelves
  addShelf: (shelf: Omit<ShelvingSegment, "id">) => string;
  updateShelf: (id: string, updates: Partial<ShelvingSegment>) => void;
  removeShelf: (id: string) => void;
  duplicateShelf: (id: string) => string | null;
  rotateShelf: (id: string) => void;

  // Wires
  addWire: (wire: Omit<PowerRoutingLine, "id">) => string;
  updateWireJoint: (wireId: string, jointIndex: number, point: Point) => void;
  removeWire: (id: string) => void;

  // Selection
  setSelection: (selection: Selection) => void;
  addToSelection: (obj: SelectedObject) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Bulk
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;

  // Serialization
  exportState: () => string;
  importState: (json: string) => { success: boolean; error?: string };

  // Power propagation
  propagatePower: () => void;

  // Room area
  getRoomAreaSqFt: () => number;
}

export type LayoutStore = LayoutState & LayoutActions;

const now = () => new Date().toISOString();

const createInitialProject = (): ProjectInfo => ({
  id: nanoid(),
  name: "Untitled Project",
  createdAt: now(),
  lastModified: now(),
});

const initialState: LayoutState = {
  project: createInitialProject(),
  view: DEFAULT_VIEW,
  room: DEFAULT_ROOM,
  archElements: [],
  shelvingSegments: [],
  powerRoutingLines: [],
  selection: [],
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    temporal(
      immer((set, get) => ({
        ...initialState,

        // View ---------------------------------------------------------------
        setZoom: (zoom) =>
          set((s) => {
            s.view.zoom = Math.max(0.25, Math.min(4, zoom));
          }),
        setPan: (x, y) =>
          set((s) => {
            s.view.panX = x;
            s.view.panY = y;
          }),
        toggleGrid: () =>
          set((s) => {
            s.view.showGrid = !s.view.showGrid;
          }),
        toggleMeasurements: () =>
          set((s) => {
            s.view.showMeasurements = !s.view.showMeasurements;
          }),
        toggleSnapToGrid: () =>
          set((s) => {
            s.view.snapToGrid = !s.view.snapToGrid;
          }),
        setActiveMode: (mode) =>
          set((s) => {
            s.view.activeMode = mode;
          }),
        fitToRoom: (stageWidth, stageHeight) =>
          set((s) => {
            const verts = s.room.polygonVertices;
            if (verts.length < 2) return;
            const xs = verts.map((v) => v.x);
            const ys = verts.map((v) => v.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const roomW = (maxX - minX) * s.view.basePixelsPerInch;
            const roomH = (maxY - minY) * s.view.basePixelsPerInch;
            const pad = 0.9;
            const zoom = Math.max(
              0.25,
              Math.min(
                4,
                Math.min((stageWidth * pad) / roomW, (stageHeight * pad) / roomH),
              ),
            );
            s.view.zoom = zoom;
            s.view.panX =
              (stageWidth - roomW * zoom) / 2 - minX * s.view.basePixelsPerInch * zoom;
            s.view.panY =
              (stageHeight - roomH * zoom) / 2 - minY * s.view.basePixelsPerInch * zoom;
          }),

        // Room ---------------------------------------------------------------
        updateVertex: (index, point) =>
          set((s) => {
            if (s.room.polygonVertices[index]) {
              s.room.polygonVertices[index] = point;
              s.project.lastModified = now();
            }
          }),
        addVertex: (afterIndex, point) =>
          set((s) => {
            s.room.polygonVertices.splice(afterIndex + 1, 0, point);
            s.project.lastModified = now();
          }),
        removeVertex: (index) =>
          set((s) => {
            if (s.room.polygonVertices.length > 3) {
              s.room.polygonVertices.splice(index, 1);
              s.project.lastModified = now();
            }
          }),
        setWallThickness: (inches) =>
          set((s) => {
            s.room.wallThicknessInches = Math.max(1, inches);
          }),
        loadTemplate: (templateId) =>
          set((s) => {
            const t = getTemplate(templateId);
            if (!t) return;
            s.room = {
              polygonVertices: t.room.polygonVertices.map((v) => ({ ...v })),
              wallThicknessInches: t.room.wallThicknessInches,
            };
            s.archElements = t.archElements.map((seed) => ({
              ...resolveArchSeed(seed),
              id: nanoid(),
            }));
            s.shelvingSegments = [];
            s.powerRoutingLines = [];
            s.selection = [];
            s.project = {
              ...s.project,
              name: t.name,
              lastModified: now(),
            };
          }),

        // Arch elements ------------------------------------------------------
        addArchElement: (element) => {
          const id = nanoid();
          set((s) => {
            s.archElements.push({ ...element, id });
            s.project.lastModified = now();
          });
          return id;
        },
        updateArchElement: (id, updates) =>
          set((s) => {
            const el = s.archElements.find((e) => e.id === id);
            if (el) {
              Object.assign(el, updates);
              s.project.lastModified = now();
            }
          }),
        removeArchElement: (id) =>
          set((s) => {
            s.archElements = s.archElements.filter((e) => e.id !== id);
            s.selection = s.selection.filter((sel) => sel.id !== id);
            s.project.lastModified = now();
          }),

        // Shelves ------------------------------------------------------------
        addShelf: (shelf) => {
          const id = nanoid();
          set((s) => {
            s.shelvingSegments.push({ ...shelf, id });
            s.project.lastModified = now();
          });
          return id;
        },
        updateShelf: (id, updates) =>
          set((s) => {
            const shelf = s.shelvingSegments.find((x) => x.id === id);
            if (shelf) {
              Object.assign(shelf, updates);
              s.project.lastModified = now();
            }
          }),
        removeShelf: (id) =>
          set((s) => {
            s.shelvingSegments = s.shelvingSegments.filter((x) => x.id !== id);
            s.selection = s.selection.filter((sel) => sel.id !== id);
            // Clear snap connections that referenced this shelf.
            for (const shelf of s.shelvingSegments) {
              if (shelf.snappedConnections.leftId === id)
                shelf.snappedConnections.leftId = null;
              if (shelf.snappedConnections.rightId === id)
                shelf.snappedConnections.rightId = null;
              if (shelf.powerSource.daisyChainedFrom === id)
                shelf.powerSource.daisyChainedFrom = null;
            }
            s.powerRoutingLines = s.powerRoutingLines.filter(
              (w) => w.startShelfId !== id,
            );
            s.project.lastModified = now();
          }),
        duplicateShelf: (id) => {
          const source = get().shelvingSegments.find((x) => x.id === id);
          if (!source) return null;
          const newId = nanoid();
          set((s) => {
            s.shelvingSegments.push({
              ...source,
              id: newId,
              x: source.x + source.lengthInches,
              y: source.y,
              snappedConnections: { leftId: null, rightId: null },
              powerSource: { connectedOutletId: null, daisyChainedFrom: null },
            });
            s.project.lastModified = now();
          });
          return newId;
        },
        rotateShelf: (id) =>
          set((s) => {
            const shelf = s.shelvingSegments.find((x) => x.id === id);
            if (shelf) {
              shelf.rotation = (shelf.rotation + 90) % 360;
              s.project.lastModified = now();
            }
          }),

        // Wires --------------------------------------------------------------
        addWire: (wire) => {
          const id = nanoid();
          set((s) => {
            s.powerRoutingLines.push({ ...wire, id });
            s.project.lastModified = now();
          });
          return id;
        },
        updateWireJoint: (wireId, jointIndex, point) =>
          set((s) => {
            const wire = s.powerRoutingLines.find((w) => w.id === wireId);
            if (wire && wire.joints[jointIndex]) {
              wire.joints[jointIndex] = point;
              s.project.lastModified = now();
            }
          }),
        removeWire: (id) =>
          set((s) => {
            s.powerRoutingLines = s.powerRoutingLines.filter((w) => w.id !== id);
            s.project.lastModified = now();
          }),

        // Selection ----------------------------------------------------------
        setSelection: (selection) =>
          set((s) => {
            s.selection = selection;
          }),
        addToSelection: (obj) =>
          set((s) => {
            if (!s.selection.find((x) => x.id === obj.id)) {
              s.selection.push(obj);
            }
          }),
        removeFromSelection: (id) =>
          set((s) => {
            s.selection = s.selection.filter((x) => x.id !== id);
          }),
        clearSelection: () =>
          set((s) => {
            s.selection = [];
          }),
        selectAll: () =>
          set((s) => {
            s.selection = [
              ...s.archElements.map((e) => ({
                type: "archElement" as const,
                id: e.id,
              })),
              ...s.shelvingSegments.map((sh) => ({
                type: "shelf" as const,
                id: sh.id,
              })),
            ];
          }),

        // Bulk ---------------------------------------------------------------
        deleteSelected: () =>
          set((s) => {
            const ids = new Set(s.selection.map((x) => x.id));
            s.archElements = s.archElements.filter((e) => !ids.has(e.id));
            s.shelvingSegments = s.shelvingSegments.filter(
              (x) => !ids.has(x.id),
            );
            s.powerRoutingLines = s.powerRoutingLines.filter(
              (w) => !ids.has(w.id),
            );
            s.selection = [];
            s.project.lastModified = now();
          }),
        duplicateSelected: () => {
          const sel = get().selection;
          const offset = 20 / get().view.basePixelsPerInch;
          set((s) => {
            const newSelection: Selection = [];
            for (const item of sel) {
              if (item.type === "shelf") {
                const source = s.shelvingSegments.find((x) => x.id === item.id);
                if (!source) continue;
                const newId = nanoid();
                s.shelvingSegments.push({
                  ...source,
                  id: newId,
                  x: source.x + offset,
                  y: source.y + offset,
                  snappedConnections: { leftId: null, rightId: null },
                  powerSource: {
                    connectedOutletId: null,
                    daisyChainedFrom: null,
                  },
                });
                newSelection.push({ type: "shelf", id: newId });
              } else if (item.type === "archElement") {
                const source = s.archElements.find((e) => e.id === item.id);
                if (!source) continue;
                const newId = nanoid();
                s.archElements.push({
                  ...source,
                  id: newId,
                  x: source.x + offset,
                  y: source.y + offset,
                });
                newSelection.push({ type: "archElement", id: newId });
              }
            }
            s.selection = newSelection;
            s.project.lastModified = now();
          });
        },
        moveSelected: (dx, dy) =>
          set((s) => {
            const ids = new Set(s.selection.map((x) => x.id));
            for (const e of s.archElements) {
              if (ids.has(e.id)) {
                e.x += dx;
                e.y += dy;
              }
            }
            for (const shelf of s.shelvingSegments) {
              if (ids.has(shelf.id)) {
                shelf.x += dx;
                shelf.y += dy;
              }
            }
            s.project.lastModified = now();
          }),

        // Serialization ------------------------------------------------------
        exportState: () => {
          const s = get();
          return JSON.stringify(
            {
              project: s.project,
              room: s.room,
              archElements: s.archElements,
              shelvingSegments: s.shelvingSegments,
              powerRoutingLines: s.powerRoutingLines,
              // Persist user-preference view fields only.
              view: {
                basePixelsPerInch: s.view.basePixelsPerInch,
                showGrid: s.view.showGrid,
                showMeasurements: s.view.showMeasurements,
                showAlignmentGuides: s.view.showAlignmentGuides,
                gridSpacingInches: s.view.gridSpacingInches,
                snapToGrid: s.view.snapToGrid,
              },
            },
            null,
            2,
          );
        },
        importState: (json) => {
          try {
            const parsed = JSON.parse(json);
            if (
              !parsed ||
              typeof parsed !== "object" ||
              !parsed.room ||
              !Array.isArray(parsed.room.polygonVertices)
            ) {
              return { success: false, error: "Invalid project shape" };
            }
            set((s) => {
              s.project = parsed.project ?? createInitialProject();
              s.room = parsed.room;
              s.archElements = Array.isArray(parsed.archElements)
                ? parsed.archElements
                : [];
              s.shelvingSegments = Array.isArray(parsed.shelvingSegments)
                ? parsed.shelvingSegments
                : [];
              s.powerRoutingLines = Array.isArray(parsed.powerRoutingLines)
                ? parsed.powerRoutingLines
                : [];
              s.selection = [];
              if (parsed.view && typeof parsed.view === "object") {
                s.view = { ...s.view, ...parsed.view };
              }
            });
            return { success: true };
          } catch (err) {
            return {
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            };
          }
        },

        // Power propagation --------------------------------------------------
        propagatePower: () =>
          set((s) => {
            const powered = new Set<string>();
            for (const sh of s.shelvingSegments) {
              if (sh.powerSource.connectedOutletId) powered.add(sh.id);
            }
            let changed = true;
            while (changed) {
              changed = false;
              for (const sh of s.shelvingSegments) {
                if (powered.has(sh.id)) continue;
                const neighbors: string[] = [];
                if (sh.snappedConnections.leftId)
                  neighbors.push(sh.snappedConnections.leftId);
                if (sh.snappedConnections.rightId)
                  neighbors.push(sh.snappedConnections.rightId);
                for (const nid of neighbors) {
                  if (powered.has(nid)) {
                    powered.add(sh.id);
                    sh.powerSource.daisyChainedFrom = nid;
                    changed = true;
                    break;
                  }
                }
              }
            }
            // Clear daisy chain for shelves no longer reachable.
            for (const sh of s.shelvingSegments) {
              if (!powered.has(sh.id) && !sh.powerSource.connectedOutletId) {
                sh.powerSource.daisyChainedFrom = null;
              }
            }
          }),

        // Derived ------------------------------------------------------------
        getRoomAreaSqFt: () => polygonSquareFeet(get().room.polygonVertices),
      })),
      {
        // Exclude transient view state from undo history.
        partialize: (state) => {
          const { view, selection, ...rest } = state as LayoutStore;
          void view;
          void selection;
          return rest;
        },
        limit: 50,
      },
    ),
    {
      name: "floor-plan-designer",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist everything except ephemeral view fields.
      partialize: (state) => ({
        project: state.project,
        room: state.room,
        archElements: state.archElements,
        shelvingSegments: state.shelvingSegments,
        powerRoutingLines: state.powerRoutingLines,
        view: {
          basePixelsPerInch: state.view.basePixelsPerInch,
          showGrid: state.view.showGrid,
          showMeasurements: state.view.showMeasurements,
          showAlignmentGuides: state.view.showAlignmentGuides,
          gridSpacingInches: state.view.gridSpacingInches,
          snapToGrid: state.view.snapToGrid,
        },
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LayoutState>;
        return {
          ...current,
          ...p,
          view: { ...current.view, ...(p.view ?? {}) },
        };
      },
    },
  ),
);
