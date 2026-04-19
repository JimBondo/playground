"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { Toolbar } from "@/components/panels/Toolbar";
import { ElementLibrary } from "@/components/panels/ElementLibrary";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { Toaster } from "./Toaster";
import { ContextMenu } from "./ContextMenu";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Canvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-white/40">
      booting canvas…
    </div>
  ),
});

export default function EditorShell() {
  useKeyboardShortcuts();

  const selection = useLayoutStore((s) => s.selection);
  const shelvingSegments = useLayoutStore((s) => s.shelvingSegments);
  const view = useLayoutStore((s) => s.view);

  // Restoration toast on first mount.
  useEffect(() => {
    const key = "floor-plan-designer";
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(key)) {
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

  const focusedShelfId =
    selection.length === 1 && selection[0].type === "shelf"
      ? selection[0].id
      : null;
  const focusedShelf = focusedShelfId
    ? shelvingSegments.find((s) => s.id === focusedShelfId) ?? null
    : null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0b0612] text-white">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ElementLibrary />
        <main className="relative min-w-0 flex-1">
          <Canvas />
          {focusedShelf ? (
            <ContextMenu
              shelf={focusedShelf}
              pixelsPerInch={view.basePixelsPerInch * view.zoom}
              panX={view.panX}
              panY={view.panY}
            />
          ) : null}
        </main>
        <PropertiesPanel />
      </div>
      <Toaster />
    </div>
  );
}
