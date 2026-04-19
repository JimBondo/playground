"use client";

import { useState } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { NewProjectDialog } from "./NewProjectDialog";

function iconButton(cls = "") {
  return `h-8 rounded-none border border-white/20 px-3 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors hover:border-[#00ffff] hover:text-[#00ffff] ${cls}`;
}

export function Toolbar() {
  const zoom = useLayoutStore((s) => s.view.zoom);
  const showGrid = useLayoutStore((s) => s.view.showGrid);
  const showMeasurements = useLayoutStore((s) => s.view.showMeasurements);
  const activeMode = useLayoutStore((s) => s.view.activeMode);
  const toggleGrid = useLayoutStore((s) => s.toggleGrid);
  const toggleMeasurements = useLayoutStore((s) => s.toggleMeasurements);
  const setZoom = useLayoutStore((s) => s.setZoom);
  const setActiveMode = useLayoutStore((s) => s.setActiveMode);
  const areaSqFt = useLayoutStore((s) => s.getRoomAreaSqFt());
  const projectName = useLayoutStore((s) => s.project.name);

  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const triggerFit = () => {
    window.dispatchEvent(new CustomEvent("fpd:fit-to-room"));
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs uppercase tracking-widest text-white/80">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#00ffff]">FPD</span>
          <span className="text-white/40">//</span>
          <span className="max-w-[18ch] truncate font-mono">{projectName}</span>
          <button
            onClick={() => setNewProjectOpen(true)}
            className={iconButton("ml-2")}
          >
            New
          </button>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="mr-2 text-white/60">{Math.round(areaSqFt)} sq ft</span>
          <button
            onClick={() => setZoom(Math.max(0.25, zoom / 1.2))}
            className={iconButton()}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(4, zoom * 1.2))}
            className={iconButton()}
            aria-label="Zoom in"
          >
            +
          </button>
          <button onClick={triggerFit} className={iconButton()}>
            Fit
          </button>
          <button onClick={toggleGrid} className={iconButton()}>
            Grid: {showGrid ? "on" : "off"}
          </button>
          <button onClick={toggleMeasurements} className={iconButton()}>
            Dims: {showMeasurements ? "on" : "off"}
          </button>
          <button
            onClick={() =>
              setActiveMode(activeMode === "wire" ? "select" : "wire")
            }
            className={iconButton(
              activeMode === "wire"
                ? "border-[#6366f1] text-[#6366f1]"
                : "",
            )}
            title="Wire Mode (W)"
          >
            Wire
          </button>
        </div>
      </header>
      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </>
  );
}
