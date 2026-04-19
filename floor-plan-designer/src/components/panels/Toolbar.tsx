"use client";

import { useLayoutStore } from "@/store/useLayoutStore";

export function Toolbar() {
  const zoom = useLayoutStore((s) => s.view.zoom);
  const showGrid = useLayoutStore((s) => s.view.showGrid);
  const toggleGrid = useLayoutStore((s) => s.toggleGrid);
  const areaSqFt = useLayoutStore((s) => s.getRoomAreaSqFt());
  const projectName = useLayoutStore((s) => s.project.name);

  return (
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs uppercase tracking-widest text-white/80">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[#00ffff]">FPD</span>
        <span className="text-white/40">//</span>
        <span className="truncate font-mono">{projectName}</span>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <span>{Math.round(areaSqFt)} sq ft</span>
        <span>zoom {Math.round(zoom * 100)}%</span>
        <button
          onClick={toggleGrid}
          className="rounded-none border border-white/20 px-2 py-1 hover:border-[#00ffff] hover:text-[#00ffff]"
        >
          grid: {showGrid ? "on" : "off"}
        </button>
      </div>
    </header>
  );
}
