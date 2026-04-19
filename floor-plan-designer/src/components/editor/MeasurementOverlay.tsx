"use client";

import { useState } from "react";

import { formatFeetInches, distance } from "@/lib/geometry";
import { parseLengthToInches } from "@/lib/parseLength";
import { useLayoutStore } from "@/store/useLayoutStore";
import type { Point } from "@/types";

interface MeasurementOverlayProps {
  vertices: Point[];
  pixelsPerInch: number;
  panX: number;
  panY: number;
  showInlineInputs: boolean;
}

/**
 * HTML-overlay measurement labels (not Konva), so each label can become an
 * editable input on click. Clicking a label opens an input; typing a length
 * in standard ft'in" format resizes that wall segment while keeping the
 * starting vertex fixed.
 */
export function MeasurementOverlay({
  vertices,
  pixelsPerInch,
  panX,
  panY,
  showInlineInputs,
}: MeasurementOverlayProps) {
  const updateVertex = useLayoutStore((s) => s.updateVertex);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  if (vertices.length < 2) return null;

  const commit = (edgeIndex: number) => {
    const parsed = parseLengthToInches(draft);
    setEditing(null);
    if (parsed == null) return;
    const a = vertices[edgeIndex];
    const b = vertices[(edgeIndex + 1) % vertices.length];
    const current = distance(a, b);
    if (current === 0) return;
    const scale = parsed / current;
    // Move vertex b along the direction a→b so segment length becomes parsed.
    const newB: Point = {
      x: a.x + (b.x - a.x) * scale,
      y: a.y + (b.y - a.y) * scale,
    };
    updateVertex((edgeIndex + 1) % vertices.length, newB);
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden={!showInlineInputs}
    >
      {vertices.map((a, i) => {
        const b = vertices[(i + 1) % vertices.length];
        const lengthInches = distance(a, b);
        if (lengthInches < 1) return null;
        const midX = ((a.x + b.x) / 2) * pixelsPerInch + panX;
        const midY = ((a.y + b.y) / 2) * pixelsPerInch + panY;
        const label = formatFeetInches(lengthInches);
        const rotation = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        const flipped = rotation > 90 || rotation < -90;
        const finalRotation = flipped ? rotation + 180 : rotation;

        if (editing === i) {
          return (
            <input
              key={`m-${i}`}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(i);
                if (e.key === "Escape") setEditing(null);
              }}
              placeholder={`e.g. ${label}`}
              className="pointer-events-auto absolute w-20 -translate-x-1/2 -translate-y-1/2 border border-[#2563eb] bg-white px-1 py-0.5 text-center font-mono text-[11px] text-slate-900 shadow outline-none"
              style={{
                left: midX,
                top: midY - 18,
                transform: `translate(-50%, -50%) rotate(${finalRotation}deg)`,
              }}
            />
          );
        }

        return (
          <button
            key={`m-${i}`}
            type="button"
            onClick={() => {
              setDraft(label);
              setEditing(i);
            }}
            title="Click to type a new length"
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-text border border-slate-300 bg-white/95 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 shadow-sm hover:border-[#2563eb] hover:text-[#2563eb]"
            style={{
              left: midX,
              top: midY - 18,
              transform: `translate(-50%, -50%) rotate(${finalRotation}deg)`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
