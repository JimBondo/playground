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

function btn(active = false, extra = "") {
  const base =
    "inline-flex h-8 items-center rounded-md border px-3 text-[12px] font-medium transition-colors";
  const active_ =
    "border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]";
  const idle =
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100";
  return `${base} ${active ? active_ : idle} ${extra}`;
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
  const triggerCenteredZoom = (factor: number) => {
    window.dispatchEvent(
      new CustomEvent("fpd:centered-zoom", { detail: { factor } }),
    );
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

  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener("fpd:save", handler);
    return () => window.removeEventListener("fpd:save", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName]);

  const shelfSelectionIds = selection
    .filter((s) => s.type === "shelf")
    .map((s) => s.id);

  return (
    <>
      <header className="flex h-12 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 text-sm text-slate-700">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-semibold text-slate-900">FPD</span>
          <span className="text-slate-300">/</span>
          <span className="max-w-[28ch] truncate" title={projectName}>
            {projectName}
          </span>
          <div className="mx-2 h-5 w-px bg-slate-200" />
          <button onClick={() => setNewProjectOpen(true)} className={btn()}>
            New
          </button>
          <button onClick={handleSave} className={btn()} title="Save JSON (Ctrl+S)">
            Save
          </button>
          <button onClick={handleLoadClick} className={btn()} title="Load JSON">
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleLoad}
          />
          <button onClick={handlePdf} className={btn()} title="Export PDF">
            PDF
          </button>
          <div className="mx-2 h-5 w-px bg-slate-200" />
          <button onClick={() => temporal.undo()} className={btn()} title="Undo (Ctrl+Z)">
            ↶ Undo
          </button>
          <button
            onClick={() => temporal.redo()}
            className={btn()}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-slate-500 tabular-nums">
            {Math.round(areaSqFt)} ft²
          </span>
          <div className="mx-2 h-5 w-px bg-slate-200" />
          <button
            onClick={() => triggerCenteredZoom(1 / 1.2)}
            className={btn()}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-14 text-center tabular-nums text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => triggerCenteredZoom(1.2)}
            className={btn()}
            aria-label="Zoom in"
          >
            +
          </button>
          <button onClick={triggerFit} className={btn()} title="Fit to room (0)">
            Fit
          </button>
          <div className="mx-2 h-5 w-px bg-slate-200" />
          <button
            onClick={toggleGrid}
            className={btn(showGrid)}
            title="Toggle grid (G)"
          >
            Grid
          </button>
          <button
            onClick={toggleMeasurements}
            className={btn(showMeasurements)}
            title="Toggle measurements (M)"
          >
            Dims
          </button>
          <button
            onClick={() =>
              setActiveMode(activeMode === "wire" ? "select" : "wire")
            }
            className={btn(activeMode === "wire")}
            title="Wire mode — click a lit shelf/freezer/fridge, then click an outlet (W)"
          >
            Wire
          </button>
          <button
            onClick={() => setElevationOpen(true)}
            disabled={shelfSelectionIds.length === 0}
            className={btn(
              false,
              shelfSelectionIds.length === 0
                ? "cursor-not-allowed opacity-40"
                : "",
            )}
            title="Front elevation of selected shelves"
          >
            Elevation
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
