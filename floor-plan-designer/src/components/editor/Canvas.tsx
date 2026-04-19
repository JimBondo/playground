"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { useLayoutStore } from "@/store/useLayoutStore";
import { useSpaceKey } from "@/hooks/useSpaceKey";
import { GridBackground } from "./GridBackground";
import { RoomPolygon } from "./RoomPolygon";
import { MeasurementOverlay } from "./MeasurementOverlay";
import { EDITOR_COLORS } from "@/lib/constants";

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_FACTOR = 1.1;

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const view = useLayoutStore((s) => s.view);
  const room = useLayoutStore((s) => s.room);
  const setZoom = useLayoutStore((s) => s.setZoom);
  const setPan = useLayoutStore((s) => s.setPan);
  const fitToRoom = useLayoutStore((s) => s.fitToRoom);

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

  // Initial fit once the stage has a known size.
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (size.width > 0 && size.height > 0) {
      fitToRoom(size.width, size.height);
      didInitialFit.current = true;
    }
  }, [size.width, size.height, fitToRoom]);

  // Toolbar emits a window event to request a fit (avoids prop drilling).
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

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setMiddleHeld(true);
    }
  }, []);
  const handleMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) setMiddleHeld(false);
  }, []);

  const panMode = spaceHeld || middleHeld;

  const handleStageDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      // Only commit pan from Stage drag — not from dragging a child element.
      if (e.target === stageRef.current) {
        setPan(e.target.x(), e.target.y());
      }
    },
    [setPan],
  );

  const handleStageDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) {
        setPan(e.target.x(), e.target.y());
      }
    },
    [setPan],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        background: EDITOR_COLORS.canvas,
        cursor: panMode ? "grab" : "default",
      }}
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
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
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
            {view.showMeasurements ? (
              <MeasurementOverlay
                vertices={room.polygonVertices}
                pixelsPerInch={effectivePPI}
              />
            ) : null}
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
