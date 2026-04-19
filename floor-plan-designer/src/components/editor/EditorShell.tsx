"use client";

import dynamic from "next/dynamic";

import { Toolbar } from "@/components/panels/Toolbar";
import { ElementLibrary } from "@/components/panels/ElementLibrary";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";

// Konva touches `window` at module load, so the entire canvas subtree must be
// client-only. Keeping the dynamic() call here (inside a client component)
// keeps the page.tsx boundary simple.
const Canvas = dynamic(() => import("./Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-white/40">
      booting canvas…
    </div>
  ),
});

export default function EditorShell() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#0b0612] text-white">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ElementLibrary />
        <main className="relative min-w-0 flex-1">
          <Canvas />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  );
}
