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
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="new-project-title" className="text-lg font-semibold text-slate-900">
            New project
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-[12px] text-slate-500 hover:bg-slate-100"
          >
            Esc
          </button>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          Pick a starting template. You can adjust the room shape, swap out
          fixtures, and add more at any time.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className="flex flex-col items-start gap-1 rounded-md border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-md"
            >
              <span className="text-[14px] font-semibold text-slate-900">
                {t.name}
              </span>
              <span className="text-[12px] text-slate-500">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
