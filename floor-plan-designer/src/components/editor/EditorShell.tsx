"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { Toolbar } from "@/components/panels/Toolbar";
import { ElementLibrary } from "@/components/panels/ElementLibrary";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { Toaster } from "./Toaster";
import { ContextMenu } from "./ContextMenu";
import { MeasurementOverlay } from "./MeasurementOverlay";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Canvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[12px] text-slate-400">
      Loading canvas…
    </div>
  ),
});

export default function EditorShell() {
  useKeyboardShortcuts();

  const selection = useLayoutStore((s) => s.selection);
  const view = useLayoutStore((s) => s.view);
  const room = useLayoutStore((s) => s.room);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem("floor-plan-designer")) {
        window.dispatchEvent(
          new CustomEvent("fpd:toast", {
            detail: { kind: "info", message: "Restored from auto-save." },
          }),
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  const effectivePPI = view.basePixelsPerInch * view.zoom;
  const focused = selection.length === 1 ? selection[0] : null;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 text-slate-900">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ElementLibrary />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <Canvas />
          {view.showMeasurements ? (
            <MeasurementOverlay
              vertices={room.polygonVertices}
              pixelsPerInch={effectivePPI}
              panX={view.panX}
              panY={view.panY}
              showInlineInputs={true}
            />
          ) : null}
          {focused ? (
            <ContextMenu
              selected={focused}
              pixelsPerInch={effectivePPI}
              panX={view.panX}
              panY={view.panY}
            />
          ) : null}
          {view.activeMode === "wire" ? (
            <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1 text-[12px] text-orange-900 shadow">
              Wire mode — click a lit shelf / freezer / wall fridge, then click
              an outlet. Press Esc to cancel.
            </div>
          ) : null}
        </main>
        <PropertiesPanel />
      </div>
      <Toaster />
    </div>
  );
}
