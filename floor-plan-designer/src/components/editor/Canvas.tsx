"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { useSpaceKey } from "@/hooks/useSpaceKey";
import { GridBackground } from "./GridBackground";
import { RoomPolygon } from "./RoomPolygon";
import { MeasurementOverlay } from "./MeasurementOverlay";
import { ArchElementNode } from "./ArchElement";
import { ShelfSegmentNode } from "./ShelfSegment";
import { AlignmentGuides } from "./AlignmentGuides";
import { SelectionBox } from "./SelectionBox";
import { WireRoute, WireInProgressPreview } from "./WireRoute";
import {
  EDITOR_COLORS,
  ARCH_ELEMENT_DEFAULTS,
  SHELF_DEFAULTS,
} from "@/lib/constants";
import {
  LIBRARY_MIME,
  type LibraryPayload,
} from "@/components/panels/ElementLibrary";
import {
  archElementBox,
  shelfBox,
  findNonCollidingPosition,
  rotatedAabb,
} from "@/lib/collision";
import type { Selection } from "@/types";

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_FACTOR = 1.1;

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const view = useLayoutStore((s) => s.view);
  const room = useLayoutStore((s) => s.room);
  const archElements = useLayoutStore((s) => s.archElements);
  const shelvingSegments = useLayoutStore((s) => s.shelvingSegments);
  const powerRoutingLines = useLayoutStore((s) => s.powerRoutingLines);
  const selection = useLayoutStore((s) => s.selection);
  const setZoom = useLayoutStore((s) => s.setZoom);
  const setPan = useLayoutStore((s) => s.setPan);
  const fitToRoom = useLayoutStore((s) => s.fitToRoom);
  const addArchElement = useLayoutStore((s) => s.addArchElement);
  const addShelf = useLayoutStore((s) => s.addShelf);
  const clearSelection = useLayoutStore((s) => s.clearSelection);
  const setSelection = useLayoutStore((s) => s.setSelection);

  const selectionBoxState = useEditorStore((s) => s.selectionBox);
  const setSelectionBox = useEditorStore((s) => s.setSelectionBox);

  const spaceHeld = useSpaceKey();
  const [middleHeld, setMiddleHeld] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (size.width > 0 && size.height > 0) {
      fitToRoom(size.width, size.height);
      didInitialFit.current = true;
    }
  }, [size.width, size.height, fitToRoom]);

  useEffect(() => {
    const handler = () => fitToRoom(size.width, size.height);
    window.addEventListener("fpd:fit-to-room", handler);
    return () => window.removeEventListener("fpd:fit-to-room", handler);
  }, [fitToRoom, size.width, size.height]);

  const effectivePPI = view.basePixelsPerInch * view.zoom;

  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const oldZoom = view.zoom;
      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newZoom =
        direction > 0
          ? Math.min(ZOOM_MAX, oldZoom * ZOOM_FACTOR)
          : Math.max(ZOOM_MIN, oldZoom / ZOOM_FACTOR);
      if (newZoom === oldZoom) return;
      const basePPI = view.basePixelsPerInch;
      const worldX = (pointer.x - view.panX) / (basePPI * oldZoom);
      const worldY = (pointer.y - view.panY) / (basePPI * oldZoom);
      const newPanX = pointer.x - worldX * basePPI * newZoom;
      const newPanY = pointer.y - worldY * basePPI * newZoom;
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    },
    [view.zoom, view.panX, view.panY, view.basePixelsPerInch, setZoom, setPan],
  );

  const panMode = spaceHeld || middleHeld;

  // ----- Selection-box drag -----
  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        e.evt.preventDefault();
        setMiddleHeld(true);
        return;
      }
      if (panMode) return;
      if (e.target !== stageRef.current) return;
      // Start selection box in stage-local coords.
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Pointer is viewport-relative; subtract stage position to get local.
      const stageX = pointer.x - stage.x();
      const stageY = pointer.y - stage.y();
      setSelectionBox({
        active: true,
        startX: stageX,
        startY: stageY,
        currentX: stageX,
        currentY: stageY,
      });
    },
    [panMode, setSelectionBox],
  );

  const handleStageMouseMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const stageX = pointer.x - stage.x();
    const stageY = pointer.y - stage.y();
    // Update wire cursor preview if we're drawing one.
    const wip = useEditorStore.getState().wireInProgress;
    if (wip) {
      const ppi = view.basePixelsPerInch * view.zoom;
      useEditorStore.getState().updateWireCursor({
        x: stageX / ppi,
        y: stageY / ppi,
      });
    }
    const box = useEditorStore.getState().selectionBox;
    if (!box || !box.active) return;
    setSelectionBox({ ...box, currentX: stageX, currentY: stageY });
  }, [setSelectionBox, view.basePixelsPerInch, view.zoom]);

  const handleStageMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) setMiddleHeld(false);
      const box = useEditorStore.getState().selectionBox;
      if (!box || !box.active) return;
      setSelectionBox(null);
      const x1 = Math.min(box.startX, box.currentX);
      const y1 = Math.min(box.startY, box.currentY);
      const x2 = Math.max(box.startX, box.currentX);
      const y2 = Math.max(box.startY, box.currentY);
      // Ignore tiny boxes (treat as click).
      if (x2 - x1 < 3 && y2 - y1 < 3) return;
      // Convert box to inches and test containment.
      const s = useLayoutStore.getState();
      const ppi = s.view.basePixelsPerInch * s.view.zoom;
      const inchBox = {
        x: x1 / ppi,
        y: y1 / ppi,
        width: (x2 - x1) / ppi,
        height: (y2 - y1) / ppi,
      };
      const hit: Selection = [];
      for (const el of s.archElements) {
        const a = rotatedAabb(archElementBox(el));
        if (
          a.x >= inchBox.x &&
          a.y >= inchBox.y &&
          a.x + a.width <= inchBox.x + inchBox.width &&
          a.y + a.height <= inchBox.y + inchBox.height
        ) {
          hit.push({ type: "archElement", id: el.id });
        }
      }
      for (const sh of s.shelvingSegments) {
        const a = rotatedAabb(shelfBox(sh));
        if (
          a.x >= inchBox.x &&
          a.y >= inchBox.y &&
          a.x + a.width <= inchBox.x + inchBox.width &&
          a.y + a.height <= inchBox.y + inchBox.height
        ) {
          hit.push({ type: "shelf", id: sh.id });
        }
      }
      setSelection(hit);
    },
    [setSelectionBox, setSelection],
  );

  const handleStageDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) setPan(e.target.x(), e.target.y());
    },
    [setPan],
  );
  const handleStageDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) setPan(e.target.x(), e.target.y());
    },
    [setPan],
  );

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (panMode) return;
      const mode = useLayoutStore.getState().view.activeMode;
      // In wire mode, empty-space click adds a joint.
      if (mode === "wire" && e.target === stageRef.current) {
        const wip = useEditorStore.getState().wireInProgress;
        if (!wip) return;
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const stageX = pointer.x - stage.x();
        const stageY = pointer.y - stage.y();
        const ppi = view.basePixelsPerInch * view.zoom;
        useEditorStore.getState().pushWireJoint({
          x: stageX / ppi,
          y: stageY / ppi,
        });
        return;
      }
      if (e.target === stageRef.current && !selectionBoxState?.active) {
        if (!e.evt.shiftKey) clearSelection();
      }
    },
    [clearSelection, panMode, selectionBoxState, view.basePixelsPerInch, view.zoom],
  );

  // ----- Library drop -----
  const screenToInches = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (clientX - rect.left - view.panX) / effectivePPI,
      y: (clientY - rect.top - view.panY) / effectivePPI,
    };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(LIBRARY_MIME);
    if (!raw) return;
    let payload: LibraryPayload;
    try {
      payload = JSON.parse(raw) as LibraryPayload;
    } catch {
      return;
    }
    const dropPoint = screenToInches(e.clientX, e.clientY);
    if (!dropPoint) return;

    const storeState = useLayoutStore.getState();

    if (payload.kind === "arch") {
      const defaults = ARCH_ELEMENT_DEFAULTS[payload.type];
      const box = {
        x: dropPoint.x,
        y: dropPoint.y,
        width: defaults.widthInches,
        height: defaults.depthInches,
        rotation: 0,
      };
      const placed = findNonCollidingPosition(box, {
        selfId: null,
        archElements: storeState.archElements,
        shelvingSegments: storeState.shelvingSegments,
        roomVertices: storeState.room.polygonVertices,
      });
      const id = addArchElement({
        type: payload.type,
        x: placed.x,
        y: placed.y,
        rotation: placed.rotation,
        widthInches: defaults.widthInches,
        depthInches: defaults.depthInches,
      });
      setSelection([{ type: "archElement", id }]);
    } else {
      const defaults = SHELF_DEFAULTS[payload.type];
      // Lit-shelf validation: require at least one outlet.
      if (
        payload.type === "litShelf" &&
        !storeState.archElements.some((e) => e.type === "outlet")
      ) {
        window.dispatchEvent(
          new CustomEvent("fpd:toast", {
            detail: {
              kind: "warn",
              message:
                "Add an electrical outlet before placing lit shelves.",
            },
          }),
        );
        return;
      }
      const box = {
        x: dropPoint.x,
        y: dropPoint.y,
        width: defaults.lengthInches,
        height: defaults.widthInches,
        rotation: 0,
      };
      const placed = findNonCollidingPosition(box, {
        selfId: null,
        archElements: storeState.archElements,
        shelvingSegments: storeState.shelvingSegments,
        roomVertices: storeState.room.polygonVertices,
      });
      const id = addShelf({
        type: payload.type,
        lengthInches: defaults.lengthInches,
        widthInches: defaults.widthInches,
        heightInches: defaults.heightInches,
        x: placed.x,
        y: placed.y,
        rotation: placed.rotation,
        powerSource: { connectedOutletId: null, daisyChainedFrom: null },
        snappedConnections: { leftId: null, rightId: null },
      });
      setSelection([{ type: "shelf", id }]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(LIBRARY_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const selectedIds = new Set(selection.map((s) => s.id));

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        background: EDITOR_COLORS.canvas,
        cursor: panMode ? "grab" : "default",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {size.width > 0 && size.height > 0 ? (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={view.panX}
          y={view.panY}
          draggable={panMode}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onClick={handleStageClick}
          onTap={(e) => {
            if (e.target === stageRef.current && !panMode) clearSelection();
          }}
          onDragMove={handleStageDragMove}
          onDragEnd={handleStageDragEnd}
        >
          <Layer>
            {view.showGrid ? (
              <GridBackground
                width={size.width}
                height={size.height}
                effectivePPI={effectivePPI}
                gridSpacingInches={view.gridSpacingInches}
                offsetX={view.panX}
                offsetY={view.panY}
              />
            ) : null}
            <RoomPolygon
              vertices={room.polygonVertices}
              pixelsPerInch={effectivePPI}
              wallThicknessInches={room.wallThicknessInches}
              interactive={!panMode}
            />
            {archElements.map((el) => (
              <ArchElementNode
                key={el.id}
                element={el}
                pixelsPerInch={effectivePPI}
                selected={selectedIds.has(el.id)}
              />
            ))}
            {shelvingSegments.map((sh) => (
              <ShelfSegmentNode
                key={sh.id}
                shelf={sh}
                pixelsPerInch={effectivePPI}
                selected={selectedIds.has(sh.id)}
              />
            ))}
            {powerRoutingLines.map((wire) => (
              <WireRoute
                key={wire.id}
                wire={wire}
                pixelsPerInch={effectivePPI}
              />
            ))}
            <WireInProgressPreview pixelsPerInch={effectivePPI} />
            {view.showMeasurements ? (
              <MeasurementOverlay
                vertices={room.polygonVertices}
                pixelsPerInch={effectivePPI}
              />
            ) : null}
            <AlignmentGuides
              width={size.width}
              height={size.height}
              offsetX={view.panX}
              offsetY={view.panY}
            />
            <SelectionBox />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
