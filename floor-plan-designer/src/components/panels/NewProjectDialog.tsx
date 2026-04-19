"use client";

import { useEffect } from "react";
import { TEMPLATES } from "@/lib/templates";
import { useLayoutStore } from "@/store/useLayoutStore";

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewProjectDialog({ open, onClose }: NewProjectDialogProps) {
  const loadTemplate = useLayoutStore((s) => s.loadTemplate);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (id: string) => {
    loadTemplate(id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl border-2 border-[#00ffff] bg-[#0b0612] p-6 shadow-[0_0_40px_rgba(0,255,255,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
          <h2
            id="new-project-title"
            className="font-mono text-lg uppercase tracking-widest text-[#00ffff]"
          >
            New Project — Pick a Template
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-[#ff00ff]"
          >
            Esc
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className="group flex flex-col items-start border border-white/20 bg-black/40 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00ffff] hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            >
              <span className="font-mono text-sm uppercase tracking-widest text-white group-hover:text-[#00ffff]">
                {t.name}
              </span>
              <span className="mt-1 text-xs text-white/60">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
