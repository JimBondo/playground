"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";

import { useLayoutStore } from "@/store/useLayoutStore";
import { GridBackground } from "./GridBackground";
import { RoomPolygon } from "./RoomPolygon";
import { EDITOR_COLORS } from "@/lib/constants";

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const view = useLayoutStore((s) => s.view);
  const room = useLayoutStore((s) => s.room);

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

  const effectivePPI = view.basePixelsPerInch * view.zoom;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{ background: EDITOR_COLORS.canvas }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Stage
          width={size.width}
          height={size.height}
          x={view.panX}
          y={view.panY}
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
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
