"use client";

import { useEffect, useMemo } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { SHELF_DEFAULTS } from "@/lib/constants";
import { formatFeetInches } from "@/lib/geometry";
import type { ShelvingSegment } from "@/types";

interface ElevationModalProps {
  open: boolean;
  onClose: () => void;
  shelfIds: string[];
}

const SHELF_LEVELS = 4; // horizontal shelf lines per segment

export function ElevationModal({
  open,
  onClose,
  shelfIds,
}: ElevationModalProps) {
  const shelves = useLayoutStore((s) => s.shelvingSegments);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const selected = useMemo<ShelvingSegment[]>(() => {
    const ids = new Set(shelfIds);
    return shelves
      .filter((s) => ids.has(s.id))
      .sort((a, b) => a.x - b.x);
  }, [shelves, shelfIds]);

  if (!open) return null;

  const totalWidthIn = selected.reduce((a, s) => a + s.lengthInches, 0);
  const maxHeightIn = Math.max(...selected.map((s) => s.heightInches), 84);
  const scale = Math.min(900 / (totalWidthIn || 1), 450 / maxHeightIn);
  const svgW = totalWidthIn * scale;
  const svgH = maxHeightIn * scale;

  let cursorX = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="elev-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] w-full max-w-5xl overflow-auto border-2 border-[#00ffff] bg-[#0b0612] p-6 shadow-[0_0_40px_rgba(0,255,255,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
          <h2
            id="elev-title"
            className="font-mono text-lg uppercase tracking-widest text-[#00ffff]"
          >
            Front Elevation — {selected.length} shelves
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-[#ff00ff]"
          >
            Close · Esc
          </button>
        </div>

        {selected.length === 0 ? (
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            No shelves selected.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              width={svgW + 20}
              height={svgH + 60}
              style={{ background: "#0e0620" }}
            >
              <g transform={`translate(10, ${svgH + 10})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={svgW}
                  y2={0}
                  stroke="#2d1b4e"
                  strokeWidth={2}
                />
              </g>
              <g transform="translate(10, 10)">
                {selected.map((s) => {
                  const w = s.lengthInches * scale;
                  const h = s.heightInches * scale;
                  const top = svgH - h;
                  const x = cursorX;
                  cursorX += w;

                  return (
                    <g key={s.id} transform={`translate(${x}, ${top})`}>
                      {/* Outer frame */}
                      <rect
                        x={0}
                        y={0}
                        width={w}
                        height={h}
                        fill="#140a26"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />

                      {/* Peg board dot pattern */}
                      {s.type === "pegBoard" ? (
                        <g opacity={0.7}>
                          {Array.from({ length: 6 }).map((_, row) =>
                            Array.from({ length: 10 }).map((_, col) => (
                              <circle
                                key={`${row}-${col}`}
                                cx={((col + 0.5) / 10) * w}
                                cy={((row + 0.5) / 6) * h}
                                r={1.5}
                                fill="#ff00ff"
                              />
                            )),
                          )}
                        </g>
                      ) : null}

                      {/* Horizontal shelf lines for non-peg shelves */}
                      {s.type !== "pegBoard"
                        ? Array.from({ length: SHELF_LEVELS }).map((_, i) => (
                            <line
                              key={i}
                              x1={4}
                              x2={w - 4}
                              y1={(h / (SHELF_LEVELS + 1)) * (i + 1)}
                              y2={(h / (SHELF_LEVELS + 1)) * (i + 1)}
                              stroke="#00ffff"
                              strokeWidth={1}
                              opacity={0.75}
                            />
                          ))
                        : null}

                      {/* Generic product placeholders on each shelf */}
                      {s.type !== "pegBoard"
                        ? Array.from({ length: SHELF_LEVELS }).map((_, i) => {
                            const yLine = (h / (SHELF_LEVELS + 1)) * (i + 1);
                            return (
                              <g key={`p${i}`}>
                                {Array.from({ length: 4 }).map((_, j) => (
                                  <rect
                                    key={j}
                                    x={8 + j * ((w - 16) / 4)}
                                    y={yLine - 12}
                                    width={(w - 16) / 4 - 3}
                                    height={10}
                                    fill="#33ff88"
                                    opacity={0.35}
                                  />
                                ))}
                              </g>
                            );
                          })
                        : null}

                      {/* Lit-shelf glow */}
                      {s.type === "litShelf" ? (
                        <defs>
                          <linearGradient
                            id={`glow-${s.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ffffee" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ffffee" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      ) : null}
                      {s.type === "litShelf" ? (
                        <rect
                          x={0}
                          y={0}
                          width={w}
                          height={h * 0.35}
                          fill={`url(#glow-${s.id})`}
                        />
                      ) : null}

                      {/* Type label */}
                      <text
                        x={4}
                        y={12}
                        fontSize={9}
                        fontFamily="monospace"
                        fill="#e0e0e0"
                      >
                        {SHELF_DEFAULTS[s.type].label}
                      </text>

                      {/* Dimension label (below) */}
                      <text
                        x={w / 2}
                        y={h + 14}
                        fontSize={9}
                        fontFamily="monospace"
                        fill="#a0a0a0"
                        textAnchor="middle"
                      >
                        {formatFeetInches(s.lengthInches)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/40">
              Total run: {formatFeetInches(totalWidthIn)} · tallest segment{" "}
              {formatFeetInches(maxHeightIn)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
