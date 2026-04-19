"use client";

import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "@/lib/constants";

export function ElementLibrary() {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-white/10 bg-black/30 p-4 text-xs uppercase tracking-widest text-white/70">
      <div>
        <div className="mb-2 font-mono text-[#ff00ff]">Architectural</div>
        <ul className="space-y-1 font-mono">
          {Object.entries(ARCH_ELEMENT_DEFAULTS).map(([key, cfg]) => (
            <li
              key={key}
              className="cursor-not-allowed border border-white/10 px-2 py-1 opacity-60"
              title="Drag-and-drop lands in Step 3"
            >
              {cfg.label}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-2 font-mono text-[#ff00ff]">Shelving</div>
        <ul className="space-y-1 font-mono">
          {Object.entries(SHELF_DEFAULTS).map(([key, cfg]) => (
            <li
              key={key}
              className="cursor-not-allowed border border-white/10 px-2 py-1 opacity-60"
              title="Drag-and-drop lands in Step 4"
            >
              {cfg.label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
