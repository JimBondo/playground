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
          className={`pointer-events-auto border px-3 py-2 font-mono text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,255,0.2)] ${
            t.kind === "warn"
              ? "border-[#ffaa33] bg-black/80 text-[#ffaa33]"
              : t.kind === "error"
                ? "border-[#ff3b6b] bg-black/80 text-[#ff3b6b]"
                : "border-[#00ffff] bg-black/80 text-[#00ffff]"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
