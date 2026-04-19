"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  kind: "info" | "warn" | "error";
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let nextId = 1;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        message?: string;
        kind?: Toast["kind"];
      };
      if (!detail?.message) return;
      const id = nextId++;
      const toast: Toast = {
        id,
        message: detail.message,
        kind: detail.kind ?? "info",
      };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener("fpd:toast", handler);
    return () => window.removeEventListener("fpd:toast", handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-md border px-3 py-2 text-[13px] shadow-lg ${
            t.kind === "warn"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : t.kind === "error"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
