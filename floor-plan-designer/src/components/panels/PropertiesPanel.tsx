"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { formatFeetInches } from "@/lib/geometry";

export function PropertiesPanel() {
  const room = useLayoutStore((s) => s.room);
  const wallThickness = useLayoutStore((s) => s.room.wallThicknessInches);
  const basePPI = useLayoutStore((s) => s.view.basePixelsPerInch);

  const xs = room.polygonVertices.map((v) => v.x);
  const ys = room.polygonVertices.map((v) => v.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...ys) - Math.min(...ys);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 border-l border-white/10 bg-black/30 p-4 font-mono text-xs uppercase tracking-widest text-white/70">
      <div className="text-[#ff00ff]">Properties</div>
      <dl className="space-y-2">
        <div className="flex justify-between border-b border-white/5 pb-1">
          <dt>Room W</dt>
          <dd className="text-white">{formatFeetInches(width)}</dd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <dt>Room D</dt>
          <dd className="text-white">{formatFeetInches(depth)}</dd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <dt>Wall</dt>
          <dd className="text-white">{wallThickness}"</dd>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1">
          <dt>Base PPI</dt>
          <dd className="text-white">{basePPI}</dd>
        </div>
      </dl>
      <p className="text-white/40 normal-case tracking-normal">
        Selecting elements unlocks per-element properties in later steps.
      </p>
    </aside>
  );
}
