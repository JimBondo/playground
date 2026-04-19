"use client";

import { useRef, useState, useEffect } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { NewProjectDialog } from "./NewProjectDialog";
import { ElevationModal } from "@/components/elevation/ElevationModal";
import {
  exportProjectJson,
  downloadJson,
  readJsonFile,
  exportPdf,
} from "@/lib/export";
import { getStage } from "@/lib/stageRef";
import { temporal } from "@/store/temporal";

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
  const selection = useLayoutStore((s) => s.selection);
  const importState = useLayoutStore((s) => s.importState);
  const propagatePower = useLayoutStore((s) => s.propagatePower);

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [elevationOpen, setElevationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFit = () => {
    window.dispatchEvent(new CustomEvent("fpd:fit-to-room"));
  };

  const handleSave = () => {
    const json = exportProjectJson(useLayoutStore.getState());
    downloadJson(projectName || "floor-plan", json);
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await readJsonFile(file);
      const result = importState(json);
      if (result.success) {
        propagatePower();
        window.dispatchEvent(
          new CustomEvent("fpd:toast", {
            detail: { kind: "info", message: `Loaded ${file.name}` },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("fpd:toast", {
            detail: {
              kind: "error",
              message: `Load failed: ${result.error ?? "unknown"}`,
            },
          }),
        );
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("fpd:toast", {
          detail: {
            kind: "error",
            message: `Read failed: ${err instanceof Error ? err.message : "unknown"}`,
          },
        }),
      );
    } finally {
      e.target.value = "";
    }
  };

  const handlePdf = async () => {
    const stage = getStage();
    if (!stage) {
      window.dispatchEvent(
        new CustomEvent("fpd:toast", {
          detail: { kind: "error", message: "Canvas not ready for export." },
        }),
      );
      return;
    }
    try {
      await exportPdf({ stage, state: useLayoutStore.getState() });
      window.dispatchEvent(
        new CustomEvent("fpd:toast", {
          detail: { kind: "info", message: "PDF exported." },
        }),
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("fpd:toast", {
          detail: {
            kind: "error",
            message: `PDF failed: ${err instanceof Error ? err.message : "unknown"}`,
          },
        }),
      );
    }
  };

  // Listen for Cmd/Ctrl+S event from keyboard hook.
  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener("fpd:save", handler);
    return () => window.removeEventListener("fpd:save", handler);
  }, [projectName]);

  const shelfSelectionIds = selection
    .filter((s) => s.type === "shelf")
    .map((s) => s.id);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-xs uppercase tracking-widest text-white/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00ffff]">FPD</span>
          <span className="text-white/40">//</span>
          <span className="max-w-[18ch] truncate font-mono">{projectName}</span>
          <button
            onClick={() => setNewProjectOpen(true)}
            className={iconButton("ml-2")}
          >
            New
          </button>
          <button onClick={handleSave} className={iconButton()} title="Save JSON (Cmd/Ctrl+S)">
            Save
          </button>
          <button onClick={handleLoadClick} className={iconButton()} title="Load JSON">
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleLoad}
          />
          <button onClick={handlePdf} className={iconButton()} title="Export PDF">
            PDF
          </button>
          <button
            onClick={() => temporal.undo()}
            className={iconButton()}
            title="Undo (Cmd/Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={() => temporal.redo()}
            className={iconButton()}
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            ↷
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
          <button onClick={triggerFit} className={iconButton()}>Fit</button>
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
              activeMode === "wire" ? "border-[#6366f1] text-[#6366f1]" : "",
            )}
            title="Wire Mode (W)"
          >
            Wire
          </button>
          <button
            onClick={() => setElevationOpen(true)}
            disabled={shelfSelectionIds.length === 0}
            className={iconButton(
              shelfSelectionIds.length === 0
                ? "cursor-not-allowed opacity-40"
                : "",
            )}
            title="View Front Elevation of selected shelves"
          >
            Elev
          </button>
        </div>
      </header>
      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
      <ElevationModal
        open={elevationOpen}
        onClose={() => setElevationOpen(false)}
        shelfIds={shelfSelectionIds}
      />
    </>
  );
}
